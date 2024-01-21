import { bindThis } from '@/decorators.js';
import Module from '@/module.js';
import Message from '@/message';

export default class extends Module {
	public readonly name = 'test';

	@bindThis
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@bindThis
	private async mentionHook(msg: Message) {
		if (msg.text && msg.text.includes('ping')) {
			msg.reply('PONG!', {
				immediate: true
			});
			return true;
		} else {
			return false;
		}
	}
}
