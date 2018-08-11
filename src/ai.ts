// AI CORE

import * as WebSocket from 'ws';
import * as request from 'request-promise-native';
import serifs from './serifs';
import config from './config';
import IModule from './module';
import MessageLike from './message-like';
const ReconnectingWebSocket = require('../node_modules/reconnecting-websocket/dist/reconnecting-websocket-cjs.js');

/**
 * 藍
 */
export default class 藍 {
	private account: any;

	/**
	 * ホームストリーム
	 */
	private connection: any;

	private modules: IModule[] = [];

	constructor(account: any) {
		this.account = account;

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
				if (msg.body.userId == this.account.id) return; // 自分は弾く
				if (msg.body.text.startsWith('@' + this.account.username)) {
					this.onMention(new MessageLike(this, msg.body, false));
				}
				break;
			}

			// 返信されたとき
			case 'reply': {
				if (msg.body.userId == this.account.id) return; // 自分は弾く
				this.onMention(new MessageLike(this, msg.body, false));
				break;
			}

			// メッセージ
			case 'messaging_message': {
				if (msg.body.userId == this.account.id) return; // 自分は弾く
				this.onMention(new MessageLike(this, msg.body, true));
				break;
			}

			default:
				break;
		}
	}

	private onMention = (msg: MessageLike) => {
		console.log(`mention received: ${msg.id}`);

		setTimeout(() => {
			if (msg.isMessage) {
				// 既読にする
				this.api(`${config.apiUrl}/messaging/messages/read`, {
					messageId: msg.id,
				});
			} else {
				// リアクションする
				this.api(`${config.apiUrl}/notes/reactions/create`, {
					noteId: msg.id,
					reaction: 'love'
				});
			}
		}, 1000);

		this.modules.filter(m => m.hasOwnProperty('onMention')).some(m => {
			return m.onMention(msg);
		});
	}

	public post = (param: any) => {
		this.api('notes/create', param);
	}

	public sendMessage = (userId: any, param: any) => {
		this.api('messaging/messages/create', Object.assign({
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
