import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';
import serifs from '@/serifs';

const musicUrls = [
	'https://www.nicovideo.jp/watch/sm31677384',
	'https://www.nicovideo.jp/watch/sm19042393',
	'https://www.nicovideo.jp/watch/sm24892241',
	'https://www.nicovideo.jp/watch/sm20503793',
	'https://www.nicovideo.jp/watch/sm23393078',
	'https://www.nicovideo.jp/watch/sm24485755',
	'https://www.nicovideo.jp/watch/sm25808292',
	'https://www.nicovideo.jp/watch/sm20433229',
	'https://www.nicovideo.jp/watch/sm8541371',
	'https://www.nicovideo.jp/watch/sm34509853',
	'https://www.nicovideo.jp/watch/sm26661454',
	'https://www.nicovideo.jp/watch/sm9797269',
	'https://www.nicovideo.jp/watch/sm42536675',
	'https://www.nicovideo.jp/watch/sm10244728',
	'https://www.nicovideo.jp/watch/sm24626484',
	'https://www.nicovideo.jp/watch/sm39875801',
	'https://www.nicovideo.jp/watch/sm31472648',
	'https://www.nicovideo.jp/watch/sm22608740',
	'https://www.nicovideo.jp/watch/sm30519579',
	'https://www.nicovideo.jp/watch/sm28406516',
	'https://www.nicovideo.jp/watch/sm21652882',
	'https://www.nicovideo.jp/watch/sm32626095',
	'https://www.nicovideo.jp/watch/sm32748202',
	'https://www.nicovideo.jp/watch/sm19870840',
	'https://www.nicovideo.jp/watch/sm13471002',
	'https://www.nicovideo.jp/watch/sm13173001',
	'https://www.nicovideo.jp/watch/sm12195657',
	'https://www.nicovideo.jp/watch/sm38824626',
	'https://www.nicovideo.jp/watch/sm27057005',
	'https://www.nicovideo.jp/watch/sm21036288',
	'https://www.nicovideo.jp/watch/sm23762151',
	'https://www.nicovideo.jp/watch/nm14629738',
	'https://www.nicovideo.jp/watch/sm6529016',
	'https://www.nicovideo.jp/watch/sm19625630',
	'https://www.nicovideo.jp/watch/sm11224129',
	'https://www.nicovideo.jp/watch/sm11834233',
	'https://www.nicovideo.jp/watch/sm30519579',
	'https://www.nicovideo.jp/watch/sm32537029',
	'https://www.nicovideo.jp/watch/sm38708262'
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
		if (msg.includes(['音楽', '曲'])) {
			const music = musicUrls[Math.floor(Math.random() * musicUrls.length)];
			msg.reply(serifs.recommendMusic.suggestMusic(music));
			return true;
		}	else {
			return false;
		}
	}
}
