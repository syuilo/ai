import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';
import serifs from '@/serifs';

const vocaloidUrls = [
	// ボカロ
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
	'https://www.nicovideo.jp/watch/sm38708262',
	'https://www.nicovideo.jp/watch/sm10393864',
	'https://www.nicovideo.jp/watch/sm8061508',
	'https://www.nicovideo.jp/watch/so15313251',
	'https://www.nicovideo.jp/watch/sm2651288',
	'https://www.nicovideo.jp/watch/sm36787316',
	'https://www.nicovideo.jp/watch/sm1715919',
	'https://www.nicovideo.jp/watch/sm2397344',
	'https://www.nicovideo.jp/watch/sm25943367',
	'https://www.nicovideo.jp/watch/sm9714351',
	'https://www.nicovideo.jp/watch/sm40554570',
	'https://www.nicovideo.jp/watch/sm31533883',
	'https://www.nicovideo.jp/watch/sm33510542',
	'https://www.nicovideo.jp/watch/sm12825985',
	'https://www.nicovideo.jp/watch/sm2937784',
	'https://www.nicovideo.jp/watch/sm20296308',
	'https://www.nicovideo.jp/watch/sm30067009',
	'https://www.nicovideo.jp/watch/sm31606995',
	'https://www.nicovideo.jp/watch/sm11809611',
	'https://www.nicovideo.jp/watch/sm24536934',
	'https://www.nicovideo.jp/watch/sm12441199',
	'https://www.nicovideo.jp/watch/sm6119955',
	'https://www.nicovideo.jp/watch/sm8082467',
	'https://www.nicovideo.jp/watch/sm3504435',
	'https://www.nicovideo.jp/watch/sm14330479',
	'https://www.nicovideo.jp/watch/sm22960446',
	'https://www.nicovideo.jp/watch/sm6909505',
	'https://www.nicovideo.jp/watch/sm17910036',
	'https://www.nicovideo.jp/watch/sm15630734',
	'https://www.nicovideo.jp/watch/sm11956364',
	'https://www.nicovideo.jp/watch/sm31791630',
	'https://www.nicovideo.jp/watch/sm11398357',
	'https://www.nicovideo.jp/watch/sm28576299',
	'https://www.nicovideo.jp/watch/sm1097445',
	'https://www.nicovideo.jp/watch/sm18100389',
	'https://www.nicovideo.jp/watch/sm6529016',
	'https://www.nicovideo.jp/watch/nm6049209',
	'https://www.nicovideo.jp/watch/sm31807833',
	'https://www.nicovideo.jp/watch/sm31388743',
	'https://www.nicovideo.jp/watch/sm35761194',
	'https://www.nicovideo.jp/watch/sm27529228',
	'https://www.nicovideo.jp/watch/sm12098837',
	'https://www.nicovideo.jp/watch/sm7164046',
	'https://www.nicovideo.jp/watch/sm18623327',
	'https://www.nicovideo.jp/watch/sm7138245',
	'https://www.youtube.com/watch?v=LdnlHz3qGrQ',
	'https://www.youtube.com/watch?v=2G9vU6LIme4',
	'https://youtu.be/uAb7d7V7GMw?si=Xktq9dovh6YQmjga',
	'https://www.nicovideo.jp/watch/sm18792060',
	'https://sp.nicovideo.jp/watch/sm13304052',
	'https://youtu.be/rPECSTqQPYg?si=mOaOvLhQNBTUagiK',
	'https://www.nicovideo.jp/watch/sm11559163',
	'https://www.nicovideo.jp/watch/sm17824282',
	'https://www.nicovideo.jp/watch/sm12343338',
	'https://www.nicovideo.jp/watch/sm9375472',
	'https://www.nicovideo.jp/watch/sm11489374',
	'https://www.nicovideo.jp/watch/sm13344892',
	'https://www.nicovideo.jp/watch/sm3075492',
	'https://www.nicovideo.jp/watch/sm12850213',
	'https://www.nicovideo.jp/watch/sm10150980',
	'https://www.youtube.com/watch?v=CoL42lnNtp8',
	'https://www.nicovideo.jp/watch/sm39853779',
	'https://www.nicovideo.jp/watch/sm19748724'
	// **
]

const jPopUrls = [
	'https://youtu.be/GpADSdd68UI?si=zrmgRShTOO8m1dA7',
	'https://www.youtube.com/watch?v=qU-mi_S68Dk'
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
		if (msg.includes(['音楽', '曲', '曲者'])) {
			const music = vocaloidUrls[Math.floor(Math.random() * vocaloidUrls.length)];
			msg.reply(serifs.recommendMusic.suggestMusic(music));
			return true;
		}	else {
			return false;
		}
	}
}
