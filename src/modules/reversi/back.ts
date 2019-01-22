/**
 * -AI-
 * Botのバックエンド(思考を担当)
 *
 * 対話と思考を同じプロセスで行うと、思考時間が長引いたときにストリームから
 * 切断されてしまうので、別々のプロセスで行うようにします
 */

import * as request from 'request-promise-native';
import Reversi, { Color } from 'misskey-reversi';
import config from '../../config';
import serifs from '../../serifs';
import { User } from '../../misskey/user';

const db = {};

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
	private o: Reversi;
	private botColor: Color;

	/**
	 * 各マスの強さ (-1.0 ~ 1.0)
	 */
	private cellWeights: number[];

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
		return `${config.host}/games/reversi/${this.game.id}`;
	}

	constructor() {
		process.on('message', this.onMessage);
	}

	private onMessage = async (msg: any) => {
		switch (msg.type) {
			case '_init_': this.onInit(msg.body); break;
			case 'updateForm': this.onUpdateForn(msg.body); break;
			case 'started': this.onStarted(msg.body); break;
			case 'ended': this.onEnded(msg.body); break;
			case 'set': this.onSet(msg.body); break;
		}
	}

	// 親プロセスからデータをもらう
	private onInit = (msg: any) => {
		this.game = msg.game;
		this.form = msg.form;
		this.account = msg.account;
	}

	/**
	 * フォームが更新されたとき
	 */
	private onUpdateForn = (msg: any) => {
		this.form.find(i => i.id == msg.id).value = msg.value;
	}

	/**
	 * 対局が始まったとき
	 */
	private onStarted = (msg: any) =>  {
		this.game = msg;

		// TLに投稿する
		this.postGameStarted().then(note => {
			this.startedNote = note;
		});

		// リバーシエンジン初期化
		this.o = new Reversi(this.game.settings.map, {
			isLlotheo: this.game.settings.isLlotheo,
			canPutEverywhere: this.game.settings.canPutEverywhere,
			loopedBoard: this.game.settings.loopedBoard
		});

		//#region 各マスの価値を計算しておく

		// 標準的な 8*8 のマップなら予め定義した価値マップを使用
		if (this.o.mapWidth == 8 && this.o.mapHeight == 8 && !this.o.map.some(p => p == 'null')) {
			this.cellWeights = [
				1   , -0.4, 0   , -0.1, -0.1, 0   , -0.4, 1   ,
				-0.4, -0.5, -0.2, -0.2, -0.2, -0.2, -0.5, -0.4,
				0   , -0.2, 0   , -0.1, -0.1, 0   , -0.2, 0   ,
				-0.1, -0.2, -0.1, -0.1, -0.1, -0.1, -0.2, -0.1,
				-0.1, -0.2, -0.1, -0.1, -0.1, -0.1, -0.2, -0.1,
				0   , -0.2, 0   , -0.1, -0.1, 0   , -0.2, 0   ,
				-0.4, -0.5, -0.2, -0.2, -0.2, -0.2, -0.5, -0.4,
				1   , -0.4, 0   , -0.1, -0.1, 0   , -0.4, 1
			];
		} else {
			//#region 隅
			this.cellWeights = this.o.map.map((pix, i) => {
				if (pix == 'null') return 0;
				const [x, y] = this.o.transformPosToXy(i);
				let count = 0;
				const get = (x, y) => {
					if (x < 0 || y < 0 || x >= this.o.mapWidth || y >= this.o.mapHeight) return 'null';
					return this.o.mapDataGet(this.o.transformXyToPos(x, y));
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

				return isSumi ? 1 : 0;
			});
			//#endregion

			//#region 隅の隣は危険
			this.cellWeights.forEach((cell, i) => {
				const [x, y] = this.o.transformPosToXy(i);

				if (cell === 1) return;
				if (this.o.mapDataGet(this.o.transformXyToPos(x, y)) == 'null') return;

				const get = (x, y) => {
					if (x < 0 || y < 0 || x >= this.o.mapWidth || y >= this.o.mapHeight) return 0;
					return this.cellWeights[this.o.transformXyToPos(x, y)];
				};

				const isSumiNear = (
					(get(x - 1, y - 1) === 1) || // 左上
					(get(x    , y - 1) === 1) || // 上
					(get(x + 1, y - 1) === 1) || // 右上
					(get(x + 1, y    ) === 1) || // 右
					(get(x + 1, y + 1) === 1) || // 右下
					(get(x    , y + 1) === 1) || // 下
					(get(x - 1, y + 1) === 1) || // 左下
					(get(x - 1, y    ) === 1)    // 左
				)

				if (isSumiNear) this.cellWeights[i] = -0.5;
			});
			//#endregion

		}

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
		process.send({
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
	private onSet = (msg: any) =>  {
		this.o.put(msg.color, msg.pos);

		if (msg.next === this.botColor) {
			this.think();
		}
	}

	/**
	 * Botにとってある局面がどれだけ有利か取得する
	 */
	private staticEval = () => {
		let score = this.o.canPutSomewhere(this.botColor).length;

		this.cellWeights.forEach((weight, i) => {
			// 係数
			const coefficient = 30;
			weight = weight * coefficient;

			const stone = this.o.board[i];
			if (stone === this.botColor) {
				// TODO: 価値のあるマスに設置されている自分の石に縦か横に接するマスは価値があると判断する
				score += weight;
			} else if (stone !== null) {
				score -= weight;
			}
		});

		// ロセオならスコアを反転
		if (this.game.settings.isLlotheo) score = -score;

		// 接待ならスコアを反転
		if (this.isSettai) score = -score;

		return score;
	}

	private think = () => {
		console.log('Thinking...');
		console.time('think');

		// 接待モードのときは、全力(5手先読みくらい)で負けるようにする
		const maxDepth = this.isSettai ? 5 : this.strength;

		/**
		 * αβ法での探索
		 */
		const dive = (pos: number, alpha = -Infinity, beta = Infinity, depth = 0): number => {
			// 試し打ち
			this.o.put(this.o.turn, pos);

			const key = this.o.board.toString();
			let cache = db[key];
			if (cache) {
				if (alpha >= cache.upper) {
					this.o.undo();
					return cache.upper;
				}
				if (beta <= cache.lower) {
					this.o.undo();
					return cache.lower;
				}
				alpha = Math.max(alpha, cache.lower);
				beta = Math.min(beta, cache.upper);
			} else {
				cache = {
					upper: Infinity,
					lower: -Infinity
				};
			}

			const isBotTurn = this.o.turn === this.botColor;

			// 勝った
			if (this.o.turn === null) {
				const winner = this.o.winner;

				// 勝つことによる基本スコア
				const base = 10000;

				let score;

				if (this.game.settings.isLlotheo) {
					// 勝ちは勝ちでも、より自分の石を少なくした方が美しい勝ちだと判定する
					score = this.o.winner ? base - (this.o.blackCount * 100) : base - (this.o.whiteCount * 100);
				} else {
					// 勝ちは勝ちでも、より相手の石を少なくした方が美しい勝ちだと判定する
					score = this.o.winner ? base + (this.o.blackCount * 100) : base + (this.o.whiteCount * 100);
				}

				// 巻き戻し
				this.o.undo();

				// 接待なら自分が負けた方が高スコア
				return this.isSettai
					? winner !== this.botColor ? score : -score
					: winner === this.botColor ? score : -score;
			}

			if (depth === maxDepth) {
				// 静的に評価
				const score = this.staticEval();

				// 巻き戻し
				this.o.undo();

				return score;
			} else {
				const cans = this.o.canPutSomewhere(this.o.turn);

				let value = isBotTurn ? -Infinity : Infinity;
				let a = alpha;
				let b = beta;

				// 次のターンのプレイヤーにとって最も良い手を取得
				for (const p of cans) {
					if (isBotTurn) {
						const score = dive(p, a, beta, depth + 1);
						value = Math.max(value, score);
						a = Math.max(a, value);
						if (value >= beta) break;
					} else {
						const score = dive(p, alpha, b, depth + 1);
						value = Math.min(value, score);
						b = Math.min(b, value);
						if (value <= alpha) break;
					}
				}

				// 巻き戻し
				this.o.undo();

				if (value <= alpha) {
					cache.upper = value;
				} else if (value >= beta) {
					cache.lower = value;
				} else {
					cache.upper = value;
					cache.lower = value;
				}

				db[key] = cache;

				return value;
			}
		};

		const cans = this.o.canPutSomewhere(this.botColor);
		const scores = cans.map(p => dive(p));
		const pos = cans[scores.indexOf(Math.max(...scores))];

		console.log('Thinked:', pos);
		console.timeEnd('think');

		setTimeout(() => {
			process.send({
				type: 'put',
				pos
			});
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
				const res = await request.post(`${config.host}/api/notes/create`, {
					json: body
				});

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
