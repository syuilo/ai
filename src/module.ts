import autobind from 'autobind-decorator';
import 藍, { InstallerResult } from '@/ai';

export default abstract class Module {
	public abstract readonly name: string;

	protected ai: 藍;
	private doc: any;

	public init(ai: 藍) {
		this.ai = ai;

		this.doc = this.ai.moduleData.findOne({
			module: this.name
		});

		if (this.doc == null) {
			this.doc = this.ai.moduleData.insertOne({
				module: this.name,
				data: {}
			});
		}
	}

	public abstract install(): InstallerResult;

	@autobind
	protected log(msg: string) {
		this.ai.log(`[${this.name}]: ${msg}`);
	}

	/**
	 * コンテキストを生成し、ユーザーからの返信を待ち受けます
	 * @param key コンテキストを識別するためのキー
	 * @param isDm トークメッセージ上のコンテキストかどうか
	 * @param id トークメッセージ上のコンテキストならばトーク相手のID、そうでないなら待ち受ける投稿のID
	 * @param data コンテキストに保存するオプションのデータ
	 */
	@autobind
	protected subscribeReply(key: string | null, isDm: boolean, id: string, data?: any) {
		this.ai.subscribeReply(this, key, isDm, id, data);
	}

	/**
	 * 返信の待ち受けを解除します
	 * @param key コンテキストを識別するためのキー
	 */
	@autobind
	protected unsubscribeReply(key: string | null) {
		this.ai.unsubscribeReply(this, key);
	}

	/**
	 * 指定したミリ秒経過後に、タイムアウトコールバックを呼び出します。
	 * このタイマーは記憶に永続化されるので、途中でプロセスを再起動しても有効です。
	 * @param delay ミリ秒
	 * @param data オプションのデータ
	 */
	@autobind
	public setTimeoutWithPersistence(delay: number, data?: any) {
		this.ai.setTimeoutWithPersistence(this, delay, data);
	}

	@autobind
	protected getData() {
		return this.doc.data;
	}

	@autobind
	protected setData(data: any) {
		this.doc.data = data;
		this.ai.moduleData.update(this.doc);
	}
}
