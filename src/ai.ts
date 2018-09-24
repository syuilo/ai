// AI CORE

import * as loki from 'lokijs';
import * as WebSocket from 'ws';
import * as request from 'request-promise-native';
import config from './config';
import IModule from './module';
import MessageLike from './message-like';
import { FriendDoc } from './friend';
import { User } from './misskey/user';
import getCollection from './utils/get-collection';
const ReconnectingWebSocket = require('reconnecting-websocket');

/**
 * 藍
 */
export default class 藍 {
	public account: User;

	/**
	 * ホームストリーム
	 */
	private connection: any;

	/**
	 * ローカルタイムラインストリーム
	 */
	private localTimelineConnection: any;

	private modules: IModule[] = [];

	public db: loki;

	private contexts: loki.Collection<{
		isMessage: boolean;
		noteId?: string;
		userId?: string;
		module: string;
		key: string;
		data?: any;
	}>;

	public friends: loki.Collection<FriendDoc>;

	constructor(account: User, modules: IModule[]) {
		this.account = account;
		this.modules = modules;

		this.db = new loki('memory.json', {
			autoload: true,
			autosave: true,
			autosaveInterval: 1000,
			autoloadCallback: this.init
		});
	}

	private init = () => {
		//#region Init DB
		this.contexts = getCollection(this.db, 'contexts', {
			indices: ['key']
		});

		this.friends = getCollection(this.db, 'friends', {
			indices: ['userId']
		});
		//#endregion

		// Install modules
		this.modules.forEach(m => m.install(this));

		//#region Home stream
		this.connection = new ReconnectingWebSocket(`${config.wsUrl}/?i=${config.i}`, [], {
			constructor: WebSocket
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
		//#endregion

		//#region Local timeline stream
		this.localTimelineConnection = new ReconnectingWebSocket(`${config.wsUrl}/local-timeline?i=${config.i}`, [], {
			constructor: WebSocket
		});

		this.localTimelineConnection.addEventListener('open', () => {
			console.log('local-timeline stream opened');
		});

		this.localTimelineConnection.addEventListener('close', () => {
			console.log('local-timeline stream closed');
		});

		this.localTimelineConnection.addEventListener('message', message => {
			const msg = JSON.parse(message.data);

			this.onLocalNote(msg.body);
		});
		//#endregion
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

	private onLocalNote = (note: any) => {
		this.modules.filter(m => m.hasOwnProperty('onLocalNote')).forEach(m => {
			return m.onLocalNote(note);
		});
	}

	private onMention = (msg: MessageLike) => {
		console.log(`mention received: ${msg.id}`);

		const context = !msg.isMessage && msg.replyId == null ? null : this.contexts.findOne(msg.isMessage ? {
			isMessage: true,
			userId: msg.userId
		} : {
			isMessage: false,
			noteId: msg.replyId
		});

		let reaction = 'love';

		if (context != null) {
			const module = this.modules.find(m => m.name == context.module);
			const res = module.onReplyThisModule(msg, context.data);

			if (res != null && typeof res === 'object') {
				reaction = res.reaction;
			}
		} else {
			let res: ReturnType<IModule['onMention']>;

			this.modules.filter(m => m.hasOwnProperty('onMention')).some(m => {
				res = m.onMention(msg);
				return res === true || typeof res === 'object';
			});

			if (res != null && typeof res === 'object') {
				reaction = res.reaction;
			}
		}

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
					reaction: reaction
				});
			}
		}, 1000);
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

	public subscribeReply = (module: IModule, key: string, isMessage: boolean, id: string, data?: any) => {
		this.contexts.insertOne(isMessage ? {
			isMessage: true,
			userId: id,
			module: module.name,
			key: key,
			data: data
		} : {
			isMessage: false,
			noteId: id,
			module: module.name,
			key: key,
			data: data
		});
	}

	public unsubscribeReply = (module: IModule, key: string) => {
		this.contexts.findAndRemove({
			key: key,
			module: module.name
		});
	}
}
