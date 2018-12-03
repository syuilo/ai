// AI CORE

import * as loki from 'lokijs';
import * as request from 'request-promise-native';
import config from './config';
import IModule from './module';
import MessageLike from './message-like';
import { FriendDoc } from './friend';
import { User } from './misskey/user';
import getCollection from './utils/get-collection';
import Stream from './stream';

/**
 * 藍
 */
export default class 藍 {
	public account: User;
	public connection: Stream;
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

		// Init stream
		this.connection = new Stream();

		//#region Main stream
		const mainStream = this.connection.useSharedConnection('main');

		// メンションされたとき
		mainStream.on('mention', data => {
			if (data.userId == this.account.id) return; // 自分は弾く
			if (data.text.startsWith('@' + this.account.username)) {
				this.onMention(new MessageLike(this, data, false));
			}
		});

		// 返信されたとき
		mainStream.on('reply', data => {
			if (data.userId == this.account.id) return; // 自分は弾く
			this.onMention(new MessageLike(this, data, false));
		});

		// メッセージ
		mainStream.on('messagingMessage', data => {
			if (data.userId == this.account.id) return; // 自分は弾く
			this.onMention(new MessageLike(this, data, true));
		});
		//#endregion

		// Install modules
		this.modules.forEach(m => m.install(this));
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
				if (reaction) {
					this.api('notes/reactions/create', {
						noteId: msg.id,
						reaction: reaction
					});
				}
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
