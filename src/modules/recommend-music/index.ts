import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';
import serifs from '@/serifs';

const musicUrls = [
	'https://www.nicovideo.jp/watch/sm31677384'
]

export default class extends Module {
	public readonly name = 'recommendMusic';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (msg.includes(['音楽聞きたい', '曲聞きたい', '音楽聴きたい', '曲聴きたい'])) {
			const music = musicUrls[Math.floor(Math.random() * musicUrls.length)];
			msg.reply(serifs.recommendMusic.suggestMusic(music));
			return true;
		}	else {
			return false;
		}
	}
}
