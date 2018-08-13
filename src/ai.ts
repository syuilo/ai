// AI CORE

import * as WebSocket from 'ws';
import * as request from 'request-promise-native';
import serifs from './serifs';
import config from './config';
import IModule from './module';
import MessageLike from './message-like';
import { contexts } from './memory';
const ReconnectingWebSocket = require('../node_modules/reconnecting-websocket/dist/reconnecting-websocket-cjs.js');

/**
 * 藍
 */
export default class 藍 {
	public account: any;

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
				this.api('messaging/messages/read', {
					messageId: msg.id,
				});
			} else {
				// リアクションする
				this.api('notes/reactions/create', {
					noteId: msg.id,
					reaction: 'love'
				});
			}
		}, 1000);

		const context = !msg.isMessage && msg.replyId == null ? null : contexts.findOne(msg.isMessage ? {
			isMessage: true,
			userId: msg.userId
		} : {
			isMessage: false,
			noteId: msg.replyId
		});

		if (context != null) {
			const module = this.modules.find(m => m.name == context.module);
			module.onReplyThisModule(msg);
		} else {
			this.modules.filter(m => m.hasOwnProperty('onMention')).some(m => {
				return m.onMention(msg);
			});
		}
	}

	public post = async (param: any) => {
		const res = await this.api('notes/create', param);
		return res.createdNote;
	}

	public sendMessage = (userId: any, param: any) => {
		return this.api('messaging/messages/create', Object.assign({
			userId: userId,
		}, param));
	}

	public api = (endpoint: string, param?: any) => {
		return request.post(`${config.apiUrl}/${endpoint}`, {
			json: Object.assign({
				i: config.i
			}, param)
		});
	};

	public subscribeReply = (module: IModule, key: string, isMessage: boolean, id: string) => {
		contexts.insertOne(isMessage ? {
			isMessage: true,
			userId: id,
			module: module.name,
			key: key,
		} : {
			isMessage: false,
			noteId: id,
			module: module.name,
			key: key,
		});
	}

	public unsubscribeReply = (module: IModule, key: string) => {
		contexts.findAndRemove({
			key: key,
			module: module.name
		});
	}
}
