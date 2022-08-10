import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';

export default class extends Module {
	public readonly name = 'dic';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook,
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (msg.text && msg.text.includes('って何')) {
			// msg.textのうち、「の意味は」の直前で、「@ai」よりも後の物を抽出
			const dicPrefix = 'https://www.weblio.jp/content/';
			const rawWord = msg.text.split('って何')[0].split('@ai')[1].trim();
			// スペースがある場合は、半角スペースを除去
			const word = rawWord.replace(/\s/g, '');
			const url = dicPrefix + encodeURIComponent(word);
			msg.reply(`こんな意味っぽい？> [${word}](${url})`, {
				immediate: true,
			});
			return true;
		} else {
			return false;
		}
	}
}
