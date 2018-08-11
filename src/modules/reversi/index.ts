import * as childProcess from 'child_process';
const ReconnectingWebSocket = require('../../../node_modules/reconnecting-websocket/dist/reconnecting-websocket-cjs.js');
import 藍 from '../../ai';
import IModule from '../../module';
import serifs from '../../serifs';
import config from '../../config';
import MessageLike from '../../message-like';
import * as WebSocket from 'ws';

export default class ReversiModule implements IModule {
	private ai: 藍;

	/**
	 * リバーシストリーム
	 */
	private reversiConnection?: any;

	public install = (ai: 藍) => {
		this.ai = ai;

		this.reversiConnection = new ReconnectingWebSocket(`${config.wsUrl}/games/reversi?i=${config.i}`, [], {
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

	public onMention = (msg: MessageLike) => {
		if (msg.text && msg.text.indexOf('リバーシ') > -1) {
			if (config.reversiEnabled) {
				msg.reply(serifs.REVERSI_OK);

				this.ai.api('games/reversi/match', {
					userId: msg.userId
				});
			} else {
				msg.reply(serifs.REVERSI_DECLINE);
			}

			return true;
		} else {
			return false;
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
			const game = await this.ai.api('games/reversi/match', {
				userId: inviter.id
			});

			this.onReversiGameStart(game);
		} else {
			// todo (リバーシできない旨をメッセージで伝えるなど)
		}
	}

	private onReversiGameStart = (game: any) => {
		// ゲームストリームに接続
		const gw = new ReconnectingWebSocket(`${config.wsUrl}/games/reversi-game?i=${config.i}&game=${game.id}`, [], {
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
}
