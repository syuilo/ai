import 藍 from '../../ai';
import IModule from '../../module';
import MessageLike from '../../message-like';
import serifs from '../../serifs';

export default class TimerModule implements IModule {
	public name = 'timer';
	private ai: 藍;

	public install = (ai: 藍) => {
		this.ai = ai;
	}

	public onMention = (msg: MessageLike) => {
		const seconds = (msg.text || '').match(/([0-9]+)秒/);
		const minutes = (msg.text || '').match(/([0-9]+)分/);
		const hours = (msg.text || '').match(/([0-9]+)時間/);
		const timeStr = seconds || minutes || hours;

		if (timeStr) {
			const num = parseInt(timeStr[1], 10);

			if (num <= 0) {
				msg.reply(serifs.timer.invalid);
				return true;
			} else {
				msg.reply(serifs.timer.set);

				const time =
					seconds ? 1000 * num :
					minutes ? 1000 * 60 * num :
					hours ? 1000 * 60 * 60 * num * 1000 :
					null;

				setTimeout(() => {
					this.ai.sendMessage(msg.userId, {
						text: serifs.timer.notify.replace('{time}', timeStr[0])
					});
				}, time);

				return true;
			}
		} else {
			return false;
		}
	}
}
