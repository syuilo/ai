/**
 * -AI-
 * Botのバックエンド(思考を担当)
 *
 * 対話と思考を同じプロセスで行うと、思考時間が長引いたときにストリームから
 * 切断されてしまうので、別々のプロセスで行うようにします
 */

import got from 'got';
import * as Reversi from './engine.js';
import config from '@/config.js';
import serifs from '@/serifs.js';
import type { User } from '@/misskey/user.js';

function getUserName(user) {
	return user.name || user.username;
}

const titles = [
	'さん', 'サン', 'ｻﾝ', '㌠',
	'ちゃん', 'チャン', 'ﾁｬﾝ',
	'君', 'くん', 'クン', 'ｸﾝ',
	'先生', 'せんせい', 'センセイ', 'ｾﾝｾｲ'
];

class Session {
	private account: User;
	private game: any;
	private form: any;
	private engine: Reversi.Game;
	private botColor: Reversi.Color;

	private appliedOps: string[] = [];

	/**
	 * 隅周辺のインデックスリスト(静的評価に利用)
	 */
	private sumiNearIndexes: number[] = [];

	/**
	 * 隅のインデックスリスト(静的評価に利用)
	 */
	private sumiIndexes: number[] = [];

	/**
	 * 最大のターン数
	 */
	private maxTurn;

	/**
	 * 現在のターン数
	 */
	private currentTurn = 0;

	/**
	 * 対局が開始したことを知らせた投稿
	 */
	private startedNote: any = null;

	private get user(): User {
		return this.game.user1Id == this.account.id ? this.game.user2 : this.game.user1;
	}

	private get userName(): string {
		const name = getUserName(this.user);
		return `?[${name}](${config.host}/@${this.user.username})${titles.some(x => name.endsWith(x)) ? '' : 'さん'}`;
	}

	private get strength(): number {
		return this.form.find(i => i.id == 'strength').value;
	}

	private get isSettai(): boolean {
		return this.strength === 0;
	}

	private get allowPost(): boolean {
		return this.form.find(i => i.id == 'publish').value;
	}

	private get url(): string {
		return `${config.host}/reversi/g/${this.game.id}`;
	}

	constructor() {
		process.on('message', this.onMessage);
	}

	private onMessage = async (msg: any) => {
		switch (msg.type) {
			case '_init_': this.onInit(msg.body); break;
			case 'started': this.onStarted(msg.body); break;
			case 'ended': this.onEnded(msg.body); break;
			case 'log': this.onLog(msg.body); break;
		}
	}

	// 親プロセスからデータをもらう
	private onInit = (msg: any) => {
		this.game = msg.game;
		this.form = msg.form;
		this.account = msg.account;
	}

	/**
	 * 対局が始まったとき
	 */
	private onStarted = (msg: any) =>  {
		this.game = msg.game;
		if (this.game.canPutEverywhere) { // 対応してない
			process.send!({
				type: 'ended'
			});
			process.exit();
		}

		// TLに投稿する
		this.postGameStarted().then(note => {
			this.startedNote = note;
		});

		// リバーシエンジン初期化
		this.engine = new Reversi.Game(this.game.map, {
			isLlotheo: this.game.isLlotheo,
			canPutEverywhere: this.game.canPutEverywhere,
			loopedBoard: this.game.loopedBoard
		});

		this.maxTurn = this.engine.map.filter(p => p === 'empty').length - this.engine.board.filter(x => x != null).length;

		//#region 隅の位置計算など

		//#region 隅
		this.engine.map.forEach((pix, i) => {
			if (pix == 'null') return;

			const [x, y] = this.engine.posToXy(i);
			const get = (x, y) => {
				if (x < 0 || y < 0 || x >= this.engine.mapWidth || y >= this.engine.mapHeight) return 'null';
				return this.engine.mapDataGet(this.engine.xyToPos(x, y));
			};

			const isNotSumi = (
				// -
				//  +
				//   -
				(get(x - 1, y - 1) == 'empty' && get(x + 1, y + 1) == 'empty') ||

				//  -
				//  +
				//  -
				(get(x, y - 1) == 'empty' && get(x, y + 1) == 'empty') ||

				//   -
				//  +
				// -
				(get(x + 1, y - 1) == 'empty' && get(x - 1, y + 1) == 'empty') ||

				//
				// -+-
				//
				(get(x - 1, y) == 'empty' && get(x + 1, y) == 'empty')
			)

			const isSumi = !isNotSumi;

			if (isSumi) this.sumiIndexes.push(i);
		});
		//#endregion

		//#region 隅の隣
		this.engine.map.forEach((pix, i) => {
			if (pix == 'null') return;
			if (this.sumiIndexes.includes(i)) return;

			const [x, y] = this.engine.posToXy(i);

			const check = (x, y) => {
				if (x < 0 || y < 0 || x >= this.engine.mapWidth || y >= this.engine.mapHeight) return 0;
				return this.sumiIndexes.includes(this.engine.xyToPos(x, y));
			};

			const isSumiNear = (
				check(x - 1, y - 1) || // 左上
				check(x    , y - 1) || // 上
				check(x + 1, y - 1) || // 右上
				check(x + 1, y    ) || // 右
				check(x + 1, y + 1) || // 右下
				check(x    , y + 1) || // 下
				check(x - 1, y + 1) || // 左下
				check(x - 1, y    )    // 左
			)

			if (isSumiNear) this.sumiNearIndexes.push(i);
		});
		//#endregion

		//#endregion

		this.botColor = this.game.user1Id == this.account.id && this.game.black == 1 || this.game.user2Id == this.account.id && this.game.black == 2;

		if (this.botColor) {
			this.think();
		}
	}

	/**
	 * 対局が終わったとき
	 */
	private onEnded = async (msg: any) =>  {
		// ストリームから切断
		process.send!({
			type: 'ended'
		});

		let text: string;

		if (msg.game.surrendered) {
			if (this.isSettai) {
				text = serifs.reversi.settaiButYouSurrendered(this.userName);
			} else {
				text = serifs.reversi.youSurrendered(this.userName);
			}
		} else if (msg.winnerId) {
			if (msg.winnerId == this.account.id) {
				if (this.isSettai) {
					text = serifs.reversi.iWonButSettai(this.userName);
				} else {
					text = serifs.reversi.iWon(this.userName);
				}
			} else {
				if (this.isSettai) {
					text = serifs.reversi.iLoseButSettai(this.userName);
				} else {
					text = serifs.reversi.iLose(this.userName);
				}
			}
		} else {
			if (this.isSettai) {
				text = serifs.reversi.drawnSettai(this.userName);
			} else {
				text = serifs.reversi.drawn(this.userName);
			}
		}

		await this.post(text, this.startedNote);

		process.exit();
	}

	/**
	 * 打たれたとき
	 */
	private onLog = (log: any) => {
		if (log.id == null || !this.appliedOps.includes(log.id)) {
			switch (log.operation) {
				case 'put': {
					this.engine.putStone(log.pos);
					this.currentTurn++;

					if (this.engine.turn === this.botColor) {
						this.think();
					}
					break;
				}

				default:
					break;
			}
		}
	}

	/**
	 * Botにとってある局面がどれだけ有利か静的に評価する
	 * static(静的)というのは、先読みはせずに盤面の状態のみで評価するということ。
	 * TODO: 接待時はまるっと処理の中身を変え、とにかく相手が隅を取っていること優先な評価にする
	 */
	private staticEval = () => {
		let score = this.engine.getPuttablePlaces(this.botColor).length;

		for (const index of this.sumiIndexes) {
			const stone = this.engine.board[index];

			if (stone === this.botColor) {
				score += 1000; // 自分が隅を取っていたらスコアプラス
			} else if (stone !== null) {
				score -= 1000; // 相手が隅を取っていたらスコアマイナス
			}
		}

		// TODO: ここに (隅以外の確定石の数 * 100) をスコアに加算する処理を入れる

		for (const index of this.sumiNearIndexes) {
			const stone = this.engine.board[index];

			if (stone === this.botColor) {
				score -= 10; // 自分が隅の周辺を取っていたらスコアマイナス(危険なので)
			} else if (stone !== null) {
				score += 10; // 相手が隅の周辺を取っていたらスコアプラス
			}
		}

		// ロセオならスコアを反転
		if (this.game.isLlotheo) score = -score;

		// 接待ならスコアを反転
		if (this.isSettai) score = -score;

		return score;
	}

	private think = () => {
		console.log(`(${this.currentTurn}/${this.maxTurn}) Thinking...`);
		console.time('think');

		// 接待モードのときは、全力(5手先読みくらい)で負けるようにする
		// TODO: 接待のときは、どちらかというと「自分が不利になる手を選ぶ」というよりは、「相手に角を取らせられる手を選ぶ」ように思考する
		//       自分が不利になる手を選ぶというのは、換言すれば自分が打てる箇所を減らすことになるので、
		//       自分が打てる箇所が少ないと結果的に思考の選択肢が狭まり、対局をコントロールするのが難しくなるジレンマのようなものがある。
		//       つまり「相手を勝たせる」という意味での正しい接待は、「ゲーム序盤・中盤までは(通常通り)自分の有利になる手を打ち、終盤になってから相手が勝つように打つ」こと。
		//       とはいえ藍に求められているのは、そういった「本物の」接待ではなく、単に「角を取らせてくれる」接待だと思われるので、
		//       静的評価で「角に相手の石があるかどうか(と、ゲームが終わったときは相手が勝っているかどうか)」を考慮するようにすれば良いかもしれない。
		const maxDepth = this.isSettai ? 5 : this.strength;

		/**
		 * αβ法での探索
		 */
		const dive = (pos: number, alpha = -Infinity, beta = Infinity, depth = 0): number => {
			// 試し打ち
			this.engine.putStone(pos);

			const isBotTurn = this.engine.turn === this.botColor;

			// 勝った
			if (this.engine.turn === null) {
				const winner = this.engine.winner;

				// 勝つことによる基本スコア
				const base = 10000;

				let score;

				if (this.game.isLlotheo) {
					// 勝ちは勝ちでも、より自分の石を少なくした方が美しい勝ちだと判定する
					score = this.engine.winner ? base - (this.engine.blackCount * 100) : base - (this.engine.whiteCount * 100);
				} else {
					// 勝ちは勝ちでも、より相手の石を少なくした方が美しい勝ちだと判定する
					score = this.engine.winner ? base + (this.engine.blackCount * 100) : base + (this.engine.whiteCount * 100);
				}

				// 巻き戻し
				this.engine.undo();

				// 接待なら自分が負けた方が高スコア
				return this.isSettai
					? winner !== this.botColor ? score : -score
					: winner === this.botColor ? score : -score;
			}

			if (depth === maxDepth) {
				// 静的に評価
				const score = this.staticEval();

				// 巻き戻し
				this.engine.undo();

				return score;
			} else {
				const cans = this.engine.getPuttablePlaces(this.engine.turn);

				let value = isBotTurn ? -Infinity : Infinity;
				let a = alpha;
				let b = beta;

				// TODO: 残りターン数というよりも「空いているマスが12以下」の場合に完全読みさせる
				const nextDepth = (this.strength >= 4) && ((this.maxTurn - this.currentTurn) <= 12) ? Infinity : depth + 1;

				// 次のターンのプレイヤーにとって最も良い手を取得
				// TODO: cansをまず浅く読んで(または価値マップを利用して)から有益そうな手から順に並べ替え、効率よく枝刈りできるようにする
				for (const p of cans) {
					if (isBotTurn) {
						const score = dive(p, a, beta, nextDepth);
						value = Math.max(value, score);
						a = Math.max(a, value);
						if (value >= beta) break;
					} else {
						const score = dive(p, alpha, b, nextDepth);
						value = Math.min(value, score);
						b = Math.min(b, value);
						if (value <= alpha) break;
					}
				}

				// 巻き戻し
				this.engine.undo();

				return value;
			}
		};

		const cans = this.engine.getPuttablePlaces(this.botColor);
		const scores = cans.map(p => dive(p));
		const pos = cans[scores.indexOf(Math.max(...scores))];

		console.log('Thinked:', pos);
		console.timeEnd('think');

		this.engine.putStone(pos);
		this.currentTurn++;

		setTimeout(() => {
			const id = Math.random().toString(36).slice(2);
			process.send!({
				type: 'putStone',
				pos,
				id
			});
			this.appliedOps.push(id);

			if (this.engine.turn === this.botColor) {
				this.think();
			}
		}, 500);
	}

	/**
	 * 対局が始まったことをMisskeyに投稿します
	 */
	private postGameStarted = async () => {
		const text = this.isSettai
			? serifs.reversi.startedSettai(this.userName)
			: serifs.reversi.started(this.userName, this.strength.toString());

		return await this.post(`${text}\n→[観戦する](${this.url})`);
	}

	/**
	 * Misskeyに投稿します
	 * @param text 投稿内容
	 */
	private post = async (text: string, renote?: any) => {
		if (this.allowPost) {
			const body = {
				i: config.i,
				text: text,
				visibility: 'home'
			} as any;

			if (renote) {
				body.renoteId = renote.id;
			}

			try {
				const res = await got.post(`${config.host}/api/notes/create`, {
					json: body
				}).json();

				return res.createdNote;
			} catch (e) {
				console.error(e);
				return null;
			}
		} else {
			return null;
		}
	}
}

new Session();
