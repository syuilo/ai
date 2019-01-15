import autobind from 'autobind-decorator';
import Module from '../../module';
import MessageLike from '../../message-like';

export default class PingModule extends Module {
	public readonly name = 'ping';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
	private mentionHook(msg: MessageLike) {
		if (msg.text && msg.text.includes('ping')) {
			msg.reply('PONG!');
			return true;
		} else {
			return false;
		}
	}
}
