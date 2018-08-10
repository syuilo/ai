import * as childProcess from 'child_process';
import * as WebSocket from 'ws';
import * as request from 'request-promise-native';
const ReconnectingWebSocket = require('../node_modules/reconnecting-websocket/dist/reconnecting-websocket-cjs.js');

import serifs from './serifs';
const config = require('../config.json');

const wsUrl = config.host.replace('http', 'ws');
const apiUrl = config.host + '/api';

class MessageLike {
	private ai: 藍;
	private messageOrNote: any;
	public isMessage: boolean;

	public get id() {
		return this.messageOrNote.id;
	}

	public get userId() {
		return this.messageOrNote.userId;
	}

	public get text() {
		return this.messageOrNote.text;
	}

	constructor(ai: 藍, messageOrNote: any, isMessage: boolean) {
		this.ai = ai;
		this.messageOrNote = messageOrNote;
		this.isMessage = isMessage;
	}

	public reply = (text: string) => {
		setTimeout(() => {
			if (this.isMessage) {
				this.ai.sendMessage(this.messageOrNote.userId, {
					text: text
				});
			} else {
				this.ai.post({
					replyId: this.messageOrNote.id,
					text: text
				});
			}
		}, 2000);
	}
}

/**
 * 藍
 */
class 藍 {

	/**
	 * ホームストリーム
	 */
	private connection: any;

	/**
	 * リバーシストリーム
	 */
	private reversiConnection?: any;

	constructor() {
		this.connection = new ReconnectingWebSocket(`${wsUrl}/?i=${config.i}`, [], {
			WebSocket: WebSocket
		});

		this.connection.addEventListener('open', () => {
			console.log('home stream opened');
		});

		this.connection.addEventListener('close', () => {
			console.log('home stream closed');
		});

		this.connection.addEventListener('message', message => {
			const msg = JSON.parse(message.data);

			this.onMessage(msg);
		});

		if (config.reversiEnabled) {
			this.reversiConnection = new ReconnectingWebSocket(`${wsUrl}/games/reversi?i=${config.i}`, [], {
				WebSocket: WebSocket
			});

			this.reversiConnection.addEventListener('open', () => {
				console.log('reversi stream opened');
			});

			this.reversiConnection.addEventListener('close', () => {
				console.log('reversi stream closed');
			});

			this.reversiConnection.addEventListener('message', message => {
				const msg = JSON.parse(message.data);

				this.onReversiConnectionMessage(msg);
			});
		}
	}

	private onMessage = (msg: any) => {
		switch (msg.type) {
			// メンションされたとき
			case 'mention': {
				if (msg.body.userId == config.id) return; // 自分は弾く
				this.onMention(new MessageLike(this, msg.body, false));
				break;
			}

			// 返信されたとき
			case 'reply': {
				if (msg.body.userId == config.id) return; // 自分は弾く
				this.onMention(new MessageLike(this, msg.body, false));
				break;
			}

			// メッセージ
			case 'messaging_message': {
				if (msg.body.userId == config.id) return; // 自分は弾く
				this.onMention(new MessageLike(this, msg.body, true));
				break;
			}

			default:
				break;
		}
	}

	private onReversiConnectionMessage = (msg: any) => {
		switch (msg.type) {

			// 招待されたとき
			case 'invited': {
				this.onReversiInviteMe(msg.body.parent);
				break;
			}

			// マッチしたとき
			case 'matched': {
				this.onReversiGameStart(msg.body);
				break;
			}

			default:
				break;
		}
	}

	private onReversiInviteMe = async (inviter: any) => {
		console.log(`Someone invited me: @${inviter.username}`);

		if (config.reversiEnabled) {
			// 承認
			const game = await request.post(`${apiUrl}/games/reversi/match`, {
				json: {
					i: config.i,
					userId: inviter.id
				}
			});

			this.onReversiGameStart(game);
		} else {
			// todo (リバーシできない旨をメッセージで伝えるなど)
		}
	}

	private onReversiGameStart = (game: any) => {
		// ゲームストリームに接続
		const gw = new ReconnectingWebSocket(`${wsUrl}/games/reversi-game?i=${config.i}&game=${game.id}`, [], {
			WebSocket: WebSocket
		});

		function send(msg) {
			try {
				gw.send(JSON.stringify(msg));
			} catch (e) {
				console.error(e);
			}
		}

		gw.addEventListener('open', () => {
			console.log('reversi game stream opened');

			// フォーム
			const form = [{
				id: 'publish',
				type: 'switch',
				label: '藍が対局情報を投稿するのを許可',
				value: true
			}, {
				id: 'strength',
				type: 'radio',
				label: '強さ',
				value: 3,
				items: [{
					label: '接待',
					value: 0
				}, {
					label: '弱',
					value: 2
				}, {
					label: '中',
					value: 3
				}, {
					label: '強',
					value: 4
				}, {
					label: '最強',
					value: 5
				}]
			}];

			//#region バックエンドプロセス開始
			const ai = childProcess.fork(__dirname + '/back.js');

			// バックエンドプロセスに情報を渡す
			ai.send({
				type: '_init_',
				game,
				form
			});

			ai.on('message', msg => {
				if (msg.type == 'put') {
					send({
						type: 'set',
						pos: msg.pos
					});
				} else if (msg.type == 'close') {
					gw.close();
				}
			});

			// ゲームストリームから情報が流れてきたらそのままバックエンドプロセスに伝える
			gw.addEventListener('message', message => {
				const msg = JSON.parse(message.data);
				ai.send(msg);
			});
			//#endregion

			// フォーム初期化
			setTimeout(() => {
				send({
					type: 'init-form',
					body: form
				});
			}, 1000);

			// どんな設定内容の対局でも受け入れる
			setTimeout(() => {
				send({
					type: 'accept'
				});
			}, 2000);
		});

		gw.addEventListener('close', () => {
			console.log('reversi game stream closed');
		});
	}

	private onMention = (x: MessageLike) => {
		// リアクションする
		if (!x.isMessage) {
			setTimeout(() => {
				request.post(`${apiUrl}/notes/reactions/create`, {
					json: {
						i: config.i,
						noteId: x.id,
						reaction: 'love'
					}
				});
			}, 1000);
		}

		if (x.text && x.text.indexOf('リバーシ') > -1) {
			if (config.reversiEnabled) {
				x.reply(serifs.REVERSI_OK);

				request.post(`${apiUrl}/games/reversi/match`, {
					json: {
						i: config.i,
						userId: x.userId
					}
				});
			} else {
				x.reply(serifs.REVERSI_DECLINE);
			}
		}
	}

	public post = (param: any) => {
		setTimeout(() => {
			request.post(`${apiUrl}/notes/create`, {
				json: Object.assign({
					i: config.i
				}, param)
			});
		}, 2000);
	}

	public sendMessage = (userId: any, param: any) => {
		setTimeout(() => {
			request.post(`${apiUrl}/messaging/messages/create`, {
				json: Object.assign({
					i: config.i,
					userId: userId,
				}, param)
			});
		}, 2000);
	}
}

const ai = new 藍();
