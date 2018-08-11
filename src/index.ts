// AI CORE

import * as WebSocket from 'ws';
import * as request from 'request-promise-native';
import serifs from './serifs';
import config from './config';
import IModule from './module';
import MessageLike from './message-like';
import ReversiModule from './modules/reversi';
import ServerModule from './modules/server';
const ReconnectingWebSocket = require('../node_modules/reconnecting-websocket/dist/reconnecting-websocket-cjs.js');

/**
 * 藍
 */
export default class 藍 {

	/**
	 * ホームストリーム
	 */
	private connection: any;

	private modules: IModule[] = [];

	constructor() {
		this.connection = new ReconnectingWebSocket(`${config.wsUrl}/?i=${config.i}`, [], {
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
		}
	}

	public install = (module: IModule) => {
		module.install(this);
		this.modules.push(module);
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

	private onMention = (msg: MessageLike) => {
		console.log(`mention received: ${msg.id}`);

		// リアクションする
		if (!msg.isMessage) {
			setTimeout(() => {
				request.post(`${config.apiUrl}/notes/reactions/create`, {
					json: {
						i: config.i,
						noteId: msg.id,
						reaction: 'love'
					}
				});
			}, 1000);
		}

		this.modules.filter(m => m.hasOwnProperty('onMention')).some(m => {
			return m.onMention(msg);
		});
	}

	public post = (param: any) => {
		request.post('notes/create', param);
	}

	public sendMessage = (userId: any, param: any) => {
		this.api('messages/create', Object.assign({
			userId: userId,
		}, param));
	}

	public api = (endpoint: string, param) => {
		return request.post(`${config.apiUrl}/${endpoint}`, {
			json: Object.assign({
				i: config.i
			}, param)
		});
	};
}

const ai = new 藍();

const serverModule = new ServerModule();
ai.install(serverModule);

const reversiModule = new ReversiModule();
ai.install(reversiModule);
