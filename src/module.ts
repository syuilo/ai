import autobind from 'autobind-decorator';
import 藍, { InstallerResult } from './ai';

export default abstract class Module {
	public abstract readonly name: string;

	protected ai: 藍;

	public init(ai: 藍) {
		this.ai = ai;
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
	protected subscribeReply(key: string, isDm: boolean, id: string, data?: any) {
		this.ai.subscribeReply(this, key, isDm, id, data);
	}

	/**
	 * 返信の待ち受けを解除します
	 * @param key コンテキストを識別するためのキー
	 */
	@autobind
	protected unsubscribeReply(key: string) {
		this.ai.unsubscribeReply(this, key);
	}
}
