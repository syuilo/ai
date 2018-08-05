/**
 * -AI-
 * Botのバックエンド(思考を担当)
 *
 * 対話と思考を同じプロセスで行うと、思考時間が長引いたときにストリームから
 * 切断されてしまうので、別々のプロセスで行うようにします
 */

import * as request from 'request-promise-native';
import Reversi, { Color } from 'misskey-reversi';

const config = require('../config.json');

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
	private game: any;
	private form: any;
	private o: Reversi;
	private botColor: Color;

	/**
	 * 各マスの強さ
	 */
	private cellWeights;


	/**
	 * 対局が開始したことを知らせた投稿
	 */
	private startedNote: any = null;

	private get user(): any {
		return this.game.user1Id == config.id ? this.game.user2 : this.game.user1;
	}

	private get userName(): string {
		return `?[${getUserName(this.user)}](${config.host}/@${this.user.username})${titles.some(x => this.user.username.endsWith(x)) ? '' : 'さん'}`;
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
		return `${config.host}/reversi/${this.game.id}`;
	}

	constructor() {
		process.on('message', this.onMessage);
	}

	private onMessage = async (msg: any) => {
		switch (msg.type) {
			case '_init_': this.onInit(msg); break;
			case 'update-form': this.onUpdateForn(msg); break;
			case 'started': this.onStarted(msg); break;
			case 'ended': this.onEnded(msg); break;
			case 'set': this.onSet(msg); break;
		}
	}

	// 親プロセスからデータをもらう
	private onInit = (msg: any) => {
		this.game = msg.game;
		this.form = msg.form;
	}

	/**
	 * フォームが更新されたとき
	 */
	private onUpdateForn = (msg: any) => {
		this.form.find(i => i.id == msg.body.id).value = msg.body.value;
	}

	/**
	 * 対局が始まったとき
	 */
	private onStarted = (msg: any) =>  {
		this.game = msg.body;

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

		// 各マスの価値を計算しておく
		this.cellWeights = this.o.map.map((pix, i) => {
			if (pix == 'null') return 0;
			const [x, y] = this.o.transformPosToXy(i);
			let count = 0;
			const get = (x, y) => {
				if (x < 0 || y < 0 || x >= this.o.mapWidth || y >= this.o.mapHeight) return 'null';
				return this.o.mapDataGet(this.o.transformXyToPos(x, y));
			};

			if (get(x    , y - 1) == 'null') count++;
			if (get(x + 1, y - 1) == 'null') count++;
			if (get(x + 1, y    ) == 'null') count++;
			if (get(x + 1, y + 1) == 'null') count++;
			if (get(x    , y + 1) == 'null') count++;
			if (get(x - 1, y + 1) == 'null') count++;
			if (get(x - 1, y    ) == 'null') count++;
			if (get(x - 1, y - 1) == 'null') count++;
			//return Math.pow(count, 3);
			return count >= 4 ? 1 : 0;
		});

		this.botColor = this.game.user1Id == config.id && this.game.black == 1 || this.game.user2Id == config.id && this.game.black == 2;

		if (this.botColor) {
			this.think();
		}
	}

	/**
	 * 対局が終わったとき
	 */
	private onEnded = (msg: any) =>  {
		// ストリームから切断
		process.send({
			type: 'close'
		});

		let text: string;

		if (msg.body.game.surrendered) {
			if (this.isSettai) {
				text = `(${this.userName}を接待していたら投了されちゃいました... ごめんなさい)`;
			} else {
				text = `${this.userName}が投了しちゃいました`;
			}
		} else if (msg.body.winnerId) {
			if (msg.body.winnerId == config.id) {
				if (this.isSettai) {
					text = `${this.userName}に接待で勝ってしまいました...`;
				} else {
					text = `${this.userName}に勝ちました♪`;
				}
			} else {
				if (this.isSettai) {
					text = `(${this.userName}に接待で負けてあげました...♪)`;
				} else {
					text = `${this.userName}に負けました...`;
				}
			}
		} else {
			if (this.isSettai) {
				text = `(${this.userName}に接待で引き分けました...)`;
			} else {
				text = `${this.userName}と引き分けました～`;
			}
		}

		this.post(text, this.startedNote ? this.startedNote.id : null);

		process.exit();
	}

	/**
	 * 打たれたとき
	 */
	private onSet = (msg: any) =>  {
		this.o.put(msg.body.color, msg.body.pos);

		if (msg.body.next === this.botColor) {
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

		process.send({
			type: 'put',
			pos
		});
	}

	/**
	 * 対局が始まったことをMisskeyに投稿します
	 */
	private postGameStarted = async () => {
		const text = this.isSettai
			? `${this.userName}の接待を始めました！`
			: `対局を${this.userName}と始めました！ (強さ${this.strength})`;

		return await this.post(`${text}\n→[観戦する](${this.url})`);
	}

	/**
	 * Misskeyに投稿します
	 * @param text 投稿内容
	 */
	private post = async (text: string, renote?: any) => {
		if (this.allowPost) {
			const res = await request.post(`${config.host}/api/notes/create`, {
				json: {
					i: config.i,
					text: text,
					renoteId: renote ? renote.id : undefined
				}
			});

			return res.createdNote;
		} else {
			return null;
		}
	}
}

new Session();
