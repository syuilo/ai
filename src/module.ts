import autobind from 'autobind-decorator';
import 藍, { InstallerResult } from './ai';

export default abstract class Module {
	public abstract name: string;

	protected ai: 藍;

	constructor(ai: 藍) {
		this.ai = ai;
		this.ai.modules.push(this);
	}

	public abstract install(): InstallerResult;

	@autobind
	protected log(msg: string) {
		this.ai.log(`[module ${this.name}]: ${msg}`);
	}

	@autobind
	public subscribeReply(key: string, isMessage: boolean, id: string, data?: any) {
		this.ai.subscribeReply(this, key, isMessage, id, data);
	}

	@autobind
	public unsubscribeReply(key: string) {
		this.ai.unsubscribeReply(this, key);
	}
}
