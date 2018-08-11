import 藍 from '../../ai';
import IModule from '../../module';
import MessageLike from '../../message-like';

export default class PingModule implements IModule {
	public install = (ai: 藍) => { }

	public onMention = (msg: MessageLike) => {
		if (msg.text && msg.text.indexOf('ping') > -1) {
			msg.reply('PONG!');
			return true;
		} else {
			return false;
		}
	}
}
