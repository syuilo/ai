import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';
import fetchChatGPT from '@/utils/fetchChatGPT';

class ChatGPT extends Module {
	public readonly name = 'ChatGPT';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook,
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (msg.text && (msg.text.includes('ChatGPT'))) {
			// msg.textから"ChatGPT "を削除
			const prompt = msg.text.replace('ChatGPT ', '');
			msg.reply(await fetchChatGPT({prompt}));
			return true;
		} else {
			return false;
		}
	}
}

export default ChatGPT;
