import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';

export default class extends Module {
	public readonly name = 'dic';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (msg.text && msg.text.includes('って何')) {
            // msg.textのうち、「の意味は」の直前で、「@ai」よりも後の物を抽出
            const dic_prefix = "https://www.weblio.jp/content/";
            const raw_word = msg.text.split('って何')[0].split('@ai_dev')[1].trim();
            // スペースがある場合は、半角スペースを除去
            const word = raw_word.replace(/\s/g, '');
            const url = dic_prefix + encodeURIComponent(word);
			msg.reply(`こんな意味っぽい？> [${word}](${url})`, {
				immediate: true
			});
			return true;
		} else {
			return false;
		}
	}
}
