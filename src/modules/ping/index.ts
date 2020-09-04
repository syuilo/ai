import autobind from 'autobind-decorator';
import Module from '../../module';
import Message from '../../message';

export default class extends Module {
	public readonly name = 'ping';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
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
