// AI CORE

import autobind from 'autobind-decorator';
import * as loki from 'lokijs';
import * as request from 'request-promise-native';
import chalk from 'chalk';
const delay = require('timeout-as-promise');

import config from './config';
import Module from './module';
import Message from './message';
import { FriendDoc } from './friend';
import { User } from './misskey/user';
import getCollection from './utils/get-collection';
import Stream from './stream';
import log from './log';

type MentionHook = (msg: Message) => boolean | HandlerResult;
type ContextHook = (msg: Message, data?: any) => void | HandlerResult;

export type HandlerResult = {
	reaction: string;
};

export type InstallerResult = {
	mentionHook?: MentionHook;
	contextHook?: ContextHook;
};

/**
 * 藍
 */
export default class 藍 {
	public account: User;
	public connection: Stream;
	public modules: Module[] = [];
	private mentionHooks: MentionHook[] = [];
	private contextHooks: { [moduleName: string]: ContextHook } = {};
	public db: loki;

	private contexts: loki.Collection<{
		isDm: boolean;
		noteId?: string;
		userId?: string;
		module: string;
		key: string;
		data?: any;
	}>;

	public friends: loki.Collection<FriendDoc>;

	constructor(account: User, ready: (run: Function) => void) {
		this.account = account;

		this.log('Lodaing the memory...');

		this.db = new loki('memory.json', {
			autoload: true,
			autosave: true,
			autosaveInterval: 1000,
			autoloadCallback: err => {
				if (err) {
					this.log(chalk.red(`Failed to load the memory: ${err}`));
				} else {
					this.log(chalk.green('The memory loaded successfully'));
					ready(this.run);
				}
			}
		});
	}

	@autobind
	public log(msg: string) {
		log(chalk`[{magenta AiOS}]: ${msg}`);
	}

	@autobind
	private run() {
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
			if (data.text && data.text.startsWith('@' + this.account.username)) {
				this.onReceiveMessage(new Message(this, data, false));
			}
		});

		// 返信されたとき
		mainStream.on('reply', data => {
			if (data.userId == this.account.id) return; // 自分は弾く
			this.onReceiveMessage(new Message(this, data, false));
		});

		// メッセージ
		mainStream.on('messagingMessage', data => {
			if (data.userId == this.account.id) return; // 自分は弾く
			this.onReceiveMessage(new Message(this, data, true));
		});
		//#endregion

		// Install modules
		this.modules.forEach(m => {
			this.log(`Installing ${chalk.cyan.italic(m.name)}\tmodule...`);
			const res = m.install();
			if (res != null) {
				if (res.mentionHook) this.mentionHooks.push(res.mentionHook);
				if (res.contextHook) this.contextHooks[m.name] = res.contextHook;
			}
		});

		this.log(chalk.green.bold('Ai am now running!'));
	}

	@autobind
	private async onReceiveMessage(msg: Message): Promise<void> {
		this.log(chalk.gray(`<<< An message received: ${chalk.underline(msg.id)}`));

		// Ignore message if the user is a bot
		// To avoid infinity reply loop.
		if (msg.user.isBot) {
			return;
		}

		const isNoContext = !msg.isDm && msg.replyId == null;

		// Look up the context
		const context = isNoContext ? null : this.contexts.findOne(msg.isDm ? {
			isDm: true,
			userId: msg.userId
		} : {
			isDm: false,
			noteId: msg.replyId
		});

		let reaction = 'love';

		if (context != null) {
			const handler = this.contextHooks[context.module];
			const res = handler(msg, context.data);

			if (res != null && typeof res === 'object') {
				reaction = res.reaction;
			}
		} else {
			let res: boolean | HandlerResult;

			this.mentionHooks.some(handler => {
				res = handler(msg);
				return res === true || typeof res === 'object';
			});

			if (res != null && typeof res === 'object') {
				reaction = res.reaction;
			}
		}

		await delay(1000);

		if (msg.isDm) {
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
	}

	@autobind
	public async post(param: any) {
		const res = await this.api('notes/create', param);
		return res.createdNote;
	}

	@autobind
	public sendMessage(userId: any, param: any) {
		return this.api('messaging/messages/create', Object.assign({
			userId: userId,
		}, param));
	}

	@autobind
	public api(endpoint: string, param?: any) {
		return request.post(`${config.apiUrl}/${endpoint}`, {
			json: Object.assign({
				i: config.i
			}, param)
		});
	};

	@autobind
	public subscribeReply(module: Module, key: string, isDm: boolean, id: string, data?: any) {
		this.contexts.insertOne(isDm ? {
			isDm: true,
			userId: id,
			module: module.name,
			key: key,
			data: data
		} : {
			isDm: false,
			noteId: id,
			module: module.name,
			key: key,
			data: data
		});
	}

	@autobind
	public unsubscribeReply(module: Module, key: string) {
		this.contexts.findAndRemove({
			key: key,
			module: module.name
		});
	}
}
