// AI CORE

import * as fs from 'fs';
import autobind from 'autobind-decorator';
import * as loki from 'lokijs';
import * as request from 'request-promise-native';
import * as chalk from 'chalk';
import { v4 as uuid } from 'uuid';
const delay = require('timeout-as-promise');

import config from './config';
import Module from './module';
import Message from './message';
import Friend, { FriendDoc } from './friend';
import { User } from './misskey/user';
import Stream from './stream';
import log from './utils/log';

type MentionHook = (msg: Message) => Promise<boolean | HandlerResult>;
type ContextHook = (msg: Message, data?: any) => Promise<void | HandlerResult>;
type TimeoutCallback = (data?: any) => void;

export type HandlerResult = {
	reaction: string;
};

export type InstallerResult = {
	mentionHook?: MentionHook;
	contextHook?: ContextHook;
	timeoutCallback?: TimeoutCallback;
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
	private timeoutCallbacks: { [moduleName: string]: TimeoutCallback } = {};
	public db: loki;

	private contexts: loki.Collection<{
		isDm: boolean;
		noteId?: string;
		userId?: string;
		module: string;
		key: string;
		data?: any;
	}>;

	private timers: loki.Collection<{
		id: string;
		module: string;
		insertedAt: number;
		delay: number;
		data?: any;
	}>;

	public friends: loki.Collection<FriendDoc>;
	public moduleData: loki.Collection<any>;

	/**
	 * 藍インスタンスを生成します
	 * @param account 藍として使うアカウント
	 * @param modules モジュール。先頭のモジュールほど高優先度
	 */
	constructor(account: User, modules: Module[]) {
		this.account = account;
		this.modules = modules;

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
					this.run();
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
		this.contexts = this.getCollection('contexts', {
			indices: ['key']
		});

		this.timers = this.getCollection('timers', {
			indices: ['module']
		});

		this.friends = this.getCollection('friends', {
			indices: ['userId']
		});

		this.moduleData = this.getCollection('moduleData', {
			indices: ['module']
		});
		//#endregion

		// Init stream
		this.connection = new Stream();

		//#region Main stream
		const mainStream = this.connection.useSharedConnection('main');

		// メンションされたとき
		mainStream.on('mention', async data => {
			if (data.userId == this.account.id) return; // 自分は弾く
			if (data.text && data.text.startsWith('@' + this.account.username)) {
				// Misskeyのバグで投稿が非公開扱いになる
				if (data.text == null) data = await this.api('notes/show', { noteId: data.id });
				this.onReceiveMessage(new Message(this, data, false));
			}
		});

		// 返信されたとき
		mainStream.on('reply', async data => {
			if (data.userId == this.account.id) return; // 自分は弾く
			if (data.text && data.text.startsWith('@' + this.account.username)) return;
			// Misskeyのバグで投稿が非公開扱いになる
			if (data.text == null) data = await this.api('notes/show', { noteId: data.id });
			this.onReceiveMessage(new Message(this, data, false));
		});

		// Renoteされたとき
		mainStream.on('renote', async data => {
			if (data.userId == this.account.id) return; // 自分は弾く
			if (data.text == null && (data.files || []).length == 0) return;

			// リアクションする
			this.api('notes/reactions/create', {
				noteId: data.id,
				reaction: 'love'
			});
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
			m.init(this);
			const res = m.install();
			if (res != null) {
				if (res.mentionHook) this.mentionHooks.push(res.mentionHook);
				if (res.contextHook) this.contextHooks[m.name] = res.contextHook;
				if (res.timeoutCallback) this.timeoutCallbacks[m.name] = res.timeoutCallback;
			}
		});

		// タイマー監視
		this.crawleTimer();
		setInterval(this.crawleTimer, 1000);

		this.log(chalk.green.bold('Ai am now running!'));
	}

	/**
	 * ユーザーから話しかけられたとき
	 * (メンション、リプライ、トークのメッセージ)
	 */
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

		//#region
		// コンテキストがあればコンテキストフック呼び出し
		// なければそれぞれのモジュールについてフックが引っかかるまで呼び出し
		if (context != null) {
			const handler = this.contextHooks[context.module];
			const res = await handler(msg, context.data);

			if (res != null && typeof res === 'object') {
				reaction = res.reaction;
			}
		} else {
			let res: boolean | HandlerResult;

			for (const handler of this.mentionHooks) {
				res = await handler(msg);
				if (res === true || typeof res === 'object') break;
			}

			if (res != null && typeof res === 'object') {
				reaction = res.reaction;
			}
		}
		//#endregion

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
	private crawleTimer() {
		const timers = this.timers.find();
		for (const timer of timers) {
			// タイマーが時間切れかどうか
			if (Date.now() - (timer.insertedAt + timer.delay) >= 0) {
				this.log(`Timer expired: ${timer.module} ${timer.id}`);
				this.timers.remove(timer);
				this.timeoutCallbacks[timer.module](timer.data);
			}
		}
	}

	/**
	 * データベースのコレクションを取得します
	 */
	@autobind
	public getCollection(name: string, opts?: any): loki.Collection {
		let collection: loki.Collection;

		collection = this.db.getCollection(name);

		if (collection == null) {
			collection = this.db.addCollection(name, opts);
		}

		return collection;
	}

	@autobind
	public lookupFriend(userId: User['id']): Friend {
		const doc = this.friends.findOne({
			userId: userId
		});

		if (doc == null) return null;

		const friend = new Friend(this, { doc: doc });

		return friend;
	}

	/**
	 * ファイルをドライブにアップロードします
	 */
	@autobind
	public async upload(file: Buffer | fs.ReadStream, meta: any) {
		const res = await request.post({
			url: `${config.apiUrl}/drive/files/create`,
			formData: {
				i: config.i,
				file: {
					value: file,
					options: meta
				}
			},
			json: true
		});
		return res;
	}

	/**
	 * 投稿します
	 */
	@autobind
	public async post(param: any) {
		const res = await this.api('notes/create', param);
		return res.createdNote;
	}

	/**
	 * 指定ユーザーにトークメッセージを送信します
	 */
	@autobind
	public sendMessage(userId: any, param: any) {
		return this.api('messaging/messages/create', Object.assign({
			userId: userId,
		}, param));
	}

	/**
	 * APIを呼び出します
	 */
	@autobind
	public api(endpoint: string, param?: any) {
		return request.post(`${config.apiUrl}/${endpoint}`, {
			json: Object.assign({
				i: config.i
			}, param)
		});
	};

	/**
	 * コンテキストを生成し、ユーザーからの返信を待ち受けます
	 * @param module 待ち受けるモジュール名
	 * @param key コンテキストを識別するためのキー
	 * @param isDm トークメッセージ上のコンテキストかどうか
	 * @param id トークメッセージ上のコンテキストならばトーク相手のID、そうでないなら待ち受ける投稿のID
	 * @param data コンテキストに保存するオプションのデータ
	 */
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

	/**
	 * 返信の待ち受けを解除します
	 * @param module 解除するモジュール名
	 * @param key コンテキストを識別するためのキー
	 */
	@autobind
	public unsubscribeReply(module: Module, key: string) {
		this.contexts.findAndRemove({
			key: key,
			module: module.name
		});
	}

	/**
	 * 指定したミリ秒経過後に、そのモジュールのタイムアウトコールバックを呼び出します。
	 * このタイマーは記憶に永続化されるので、途中でプロセスを再起動しても有効です。
	 * @param module モジュール名
	 * @param delay ミリ秒
	 * @param data オプションのデータ
	 */
	@autobind
	public setTimeoutWithPersistence(module: Module, delay: number, data?: any) {
		const id = uuid();
		this.timers.insertOne({
			id: id,
			module: module.name,
			insertedAt: Date.now(),
			delay: delay,
			data: data
		});

		this.log(`Timer persisted: ${module.name} ${id} ${delay}ms`);
	}
}
