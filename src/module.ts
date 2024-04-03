import { bindThis } from '@/decorators.js';
import 藍, { HandlerResult, InstallerResult, ModuleDataDoc } from '@/ai.js';
import Message from '@/message.js';

export default abstract class Module {
	public abstract readonly name: string;

	private maybeAi?: 藍;

	/**
	 * @deprecated
	 */
	public installed?: InstalledModule;

	public init(ai: 藍) {
		this.maybeAi = ai;
	}

	public abstract install(ai: 藍): InstallerResult;

	/**
	 * @deprecated {@link Module#install} の引数を使用すること
	 */
	protected get ai(): 藍 {
		if (this.maybeAi == null) {
			throw new TypeError('This module has not been initialized');
		}
		return this.maybeAi;
	}

	/**
	 * @deprecated {@link InstalledModule#log} を使用すること
	 */
	@bindThis
	protected log(msg: string) {
		this.ai.log(`[${this.name}]: ${msg}`);
	}

	/**
	 * コンテキストを生成し、ユーザーからの返信を待ち受けます
	 * @param key コンテキストを識別するためのキー
	 * @param id トークメッセージ上のコンテキストならばトーク相手のID、そうでないなら待ち受ける投稿のID
	 * @param data コンテキストに保存するオプションのデータ
	 * @deprecated {@link InstalledModule#subscribeReply} を使用すること
	 */
	@bindThis
	protected subscribeReply(key: string | null, id: string, data?: any) {
		this.ai.subscribeReply(this, key, id, data);
	}

	/**
	 * 返信の待ち受けを解除します
	 * @param key コンテキストを識別するためのキー
	 * @deprecated {@link InstalledModule#unsubscribeReply} を使用すること
	 */
	@bindThis
	protected unsubscribeReply(key: string | null) {
		this.ai.unsubscribeReply(this, key);
	}

	/**
	 * 指定したミリ秒経過後に、タイムアウトコールバックを呼び出します。
	 * このタイマーは記憶に永続化されるので、途中でプロセスを再起動しても有効です。
	 * @param delay ミリ秒
	 * @param data オプションのデータ
	 * @deprecated {@link InstalledModule#setTimeoutWithPersistence} を使用すること
	 */
	@bindThis
	public setTimeoutWithPersistence(delay: number, data?: any) {
		this.ai.setTimeoutWithPersistence(this, delay, data);
	}

	/**
	 * @deprecated {@link InstalledModule#getData} を使用すること
	 */
	@bindThis
	protected getData() {
		let doc = this.ai.moduleData.findOne({
			module: this.name
		});
		if (doc == null) {
			doc = this.ai.moduleData.insertOne({
				module: this.name,
				data: {}
			});
		}
		return doc.data;
	}

	/**
	 * @deprecated {@link InstalledModule#setData} を使用すること
	 */
	@bindThis
	protected setData(data: any) {
		const doc = this.ai.moduleData.findOne({
			module: this.name
		});
		if (doc == null) {
			return;
		}
		doc.data = data;
		this.ai.moduleData.update(doc);
		if (this.installed != null) {
			this.installed.updateDoc();
		}
	}
}

export abstract class InstalledModule<M extends Module = Module, Data = any> implements InstallerResult {
	protected readonly module: M;

	protected readonly ai: 藍;

	private doc: ModuleDataDoc<Data>;

	constructor(module: M, ai: 藍, initialData: any = {}) {
		this.module = module;
		this.ai = ai;

		const doc = this.ai.moduleData.findOne({
			module: module.name
		});

		if (doc == null) {
			this.doc = this.ai.moduleData.insertOne({
				module: module.name,
				data: initialData
			}) as ModuleDataDoc<Data>;
		} else {
			this.doc = doc;
		}

		module.installed = this;
	}

	@bindThis
	protected log(msg: string) {
		this.ai.log(`[${this.module.name}]: ${msg}`);
	}

	/**
	 * コンテキストを生成し、ユーザーからの返信を待ち受けます
	 * @param key コンテキストを識別するためのキー
	 * @param id トークメッセージ上のコンテキストならばトーク相手のID、そうでないなら待ち受ける投稿のID
	 * @param data コンテキストに保存するオプションのデータ
	 */
	@bindThis
	protected subscribeReply(key: string | null, id: string, data?: any) {
		this.ai.subscribeReply(this.module, key, id, data);
	}

	/**
	 * 返信の待ち受けを解除します
	 * @param key コンテキストを識別するためのキー
	 */
	@bindThis
	protected unsubscribeReply(key: string | null) {
		this.ai.unsubscribeReply(this.module, key);
	}

	/**
	 * 指定したミリ秒経過後に、タイムアウトコールバックを呼び出します。
	 * このタイマーは記憶に永続化されるので、途中でプロセスを再起動しても有効です。
	 * @param delay ミリ秒
	 * @param data オプションのデータ
	 */
	@bindThis
	public setTimeoutWithPersistence(delay: number, data?: any) {
		this.ai.setTimeoutWithPersistence(this.module, delay, data);
	}

	@bindThis
	protected getData(): Data {
		return this.doc.data;
	}

	@bindThis
	protected setData(data: Data) {
		this.doc.data = data;
		this.ai.moduleData.update(this.doc);
	}

	/**
	 * @deprecated
	 */
	public updateDoc() {
		const doc = this.ai.moduleData.findOne({
			module: this.module.name
		});
		if (doc != null) {
			this.doc = doc;
		}
	}

	mentionHook?(msg: Message): Promise<boolean | HandlerResult>;

	contextHook?(key: any, msg: Message, data?: any): Promise<void | boolean | HandlerResult>;

	timeoutCallback?(data?: any): void;
}
