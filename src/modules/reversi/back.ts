/**
 * -AI-
 * Bot backend (in charge of thinking)
 *
 * If you do the interaction and thinking in the same process, they will be * disconnected from the stream when the thinking time is too long, so they should be done in separate processes.
 * * Keep them in separate processes to avoid disconnection from the stream when the thinking time is too long
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
	 * Index list around corners (used for static evaluation)
	 */
	private sumiNearIndexes: number[] = [];

	/**
	 * Corner index list (used for static evaluation)
	 */
	private sumiIndexes: number[] = [];

	/**
	 * Maximum number of turns
	 */
	private maxTurn;

	/**
	 * Number of current turns
	 */
	private currentTurn = 0;

	/**
	 * A post announcing the start of a game
	 */
	private startedNote: any = null;

	private get user(): User {
		return this.game.user1Id == this.account.id ? this.game.user2 : this.game.user1;
	}

	private get userName(): string {
		let name = getUserName(this.user);
		if (name.includes('$') || name.includes('<') || name.includes('*')) name = this.user.username;
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

	// Get data from the parent process
	private onInit = (msg: any) => {
		this.game = msg.game;
		this.form = msg.form;
		this.account = msg.account;
	}

	/**
	 * When the match started
	 */
	private onStarted = (msg: any) =>  {
		this.game = msg.game;
		if (this.game.canPutEverywhere) { // Not supported
			process.send!({
				type: 'ended'
			});
			process.exit();
		}

		// TPost to TL
		this.postGameStarted().then(note => {
			this.startedNote = note;
		});

		// Reversi Engine Initialization
		this.engine = new Reversi.Game(this.game.map, {
			isLlotheo: this.game.isLlotheo,
			canPutEverywhere: this.game.canPutEverywhere,
			loopedBoard: this.game.loopedBoard
		});

		this.maxTurn = this.engine.map.filter(p => p === 'empty').length - this.engine.board.filter(x => x != null).length;

		//#region Calculating corner positions, etc.

		//#region corner
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

		//#region Next to the corner
		this.engine.map.forEach((pix, i) => {
			if (pix == 'null') return;
			if (this.sumiIndexes.includes(i)) return;

			const [x, y] = this.engine.posToXy(i);

			const check = (x, y) => {
				if (x < 0 || y < 0 || x >= this.engine.mapWidth || y >= this.engine.mapHeight) return 0;
				return this.sumiIndexes.includes(this.engine.xyToPos(x, y));
			};

			const isSumiNear = (
				check(x - 1, y - 1) || // Top left
				check(x    , y - 1) || // top
				check(x + 1, y - 1) || // Top right
				check(x + 1, y    ) || // right
				check(x + 1, y + 1) || // Bottom right
				check(x    , y + 1) || // bottom
				check(x - 1, y + 1) || // lower left
				check(x - 1, y    )    // left
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
	 * When the game is over
	 */
	private onEnded = async (msg: any) =>  {
		// Disconnect from a stream
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
	 * When you get hit
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
	 * Statically evaluate how advantageous a certain situation is for the bot
	 * "Static" means that it evaluates only based on the state of the board without looking ahead.
 	 * TODO: When entertaining, completely change the content of the process and prioritize the evaluation of whether the opponent has taken the corner.
	 */
	private staticEval = () => {
		let score = this.engine.getPuttablePlaces(this.botColor).length;

		for (const index of this.sumiIndexes) {
			const stone = this.engine.board[index];

			if (stone === this.botColor) {
				score += 1000; // If you take a corner, you get a plus point.
			} else if (stone !== null) {
				score -= 1000; // If the opponent takes the corner, the score is subtracted.
			}
		}

		// TODO: Here we put a process to add (number of confirmed stones other than corners * 100) to the score.

		for (const index of this.sumiNearIndexes) {
			const stone = this.engine.board[index];

			if (stone === this.botColor) {
				score -= 10; // If you take the corner area, you will get a minus point (because it is dangerous).
			} else if (stone !== null) {
				score += 10; // If the opponent takes the corner area, you get a plus point.
			}
		}

		// If you use Roseo, you can reverse the score.
		if (this.game.isLlotheo) score = -score;

		// Reverse the score for entertainment
		if (this.isSettai) score = -score;

		return score;
	}

	private think = () => {
		console.log(`(${this.currentTurn}/${this.maxTurn}) Thinking...`);
		console.time('think');

		// When in entertainment mode, try to lose with all your might (about 5 moves ahead)
// TODO: When entertaining, think more like "select a move that will allow the opponent to take the bishop" rather than "select a move that will put you at a disadvantage"
// Choosing a move that will put you at a disadvantage means, in other words, reducing the number of places you can play, so
// There is a dilemma in that if you have fewer places you can play, your options for thinking are narrowed and it becomes difficult to control the game.
// In other words, the correct entertainment in the sense of "making the opponent win" is to "play a move that is advantageous to you (as usual) until the early and middle stages of the game, and then play in a way that will allow the opponent to win in the late stages."
// However, what is required of Ai is not that kind of "real" entertainment, but simply entertainment that "lets you take the bishop," so
// It may be a good idea to consider "whether the opponent has a stone in the bishop (and whether the opponent wins when the game ends)" in the static evaluation.
		const maxDepth = this.isSettai ? 5 : this.strength;

		/**
		 * Search using the αβ method
		 */
		const dive = (pos: number, alpha = -Infinity, beta = Infinity, depth = 0): number => {
			// Test shot
			this.engine.putStone(pos);

			const isBotTurn = this.engine.turn === this.botColor;

			// Won
			if (this.engine.turn === null) {
				const winner = this.engine.winner;

				// Base score by winning
				const base = 10000;

				let score;

				if (this.game.isLlotheo) {
					// A win is a win, but the more stones your opponent has, the more beautiful the win will be.
					score = this.engine.winner ? base - (this.engine.blackCount * 100) : base - (this.engine.whiteCount * 100);
				} else {
					// A win is a win, but the more stones your opponent has, the more beautiful the win will be.
					score = this.engine.winner ? base + (this.engine.blackCount * 100) : base + (this.engine.whiteCount * 100);
				}

				// Rewind
				this.engine.undo();

				// If you're entertaining someone, you get a higher score if you lose.
				return this.isSettai
					? winner !== this.botColor ? score : -score
					: winner === this.botColor ? score : -score;
			}

			if (depth === maxDepth) {
				// Statically Evaluated
				const score = this.staticEval();

				// Rewind
				this.engine.undo();

				return score;
			} else {
				const cans = this.engine.getPuttablePlaces(this.engine.turn);

				let value = isBotTurn ? -Infinity : Infinity;
				let a = alpha;
				let b = beta;

				// TODO: Rather than the number of turns remaining, it is a perfect reading when there are 12 or less vacant spaces.
				const nextDepth = (this.strength >= 4) && ((this.maxTurn - this.currentTurn) <= 12) ? Infinity : depth + 1;

				// Get the best hand for the next player
				// TODO: First, read through the list shallowly (or use a value map), then sort the list by the most profitable moves, allowing for efficient pruning.
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

				// Rewind
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
	 * Post to Misskey that the game has started
	 */
	private postGameStarted = async () => {
		const text = this.isSettai
			? serifs.reversi.startedSettai(this.userName)
			: serifs.reversi.started(this.userName, this.strength.toString());

		return await this.post(`${text}\n→[Spectate](${this.url})`);
	}

	/**
	 * Post to Misskey
	 * @param text Post Content
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
