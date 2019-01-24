import autobind from 'autobind-decorator';
import Module from '../../module';
import Message from '../../message';
import serifs from '../../serifs';

export default class extends Module {
	public readonly name = 'timer';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		const secondsQuery = (msg.text || '').match(/([0-9]+)秒/);
		const minutesQuery = (msg.text || '').match(/([0-9]+)分/);
		const hoursQuery = (msg.text || '').match(/([0-9]+)時間/);

		const seconds = secondsQuery ? parseInt(secondsQuery[1], 10) : 0;
		const minutes = minutesQuery ? parseInt(minutesQuery[1], 10) : 0;
		const hours = hoursQuery ? parseInt(hoursQuery[1], 10) : 0;

		if (secondsQuery || minutesQuery || hoursQuery) {
			if ((seconds + minutes + hours) == 0) {
				msg.reply(serifs.timer.invalid);
				return true;
			}

			const time =
				(1000 * seconds) +
				(1000 * 60 * minutes) +
				(1000 * 60 * 60 * hours);

			if (time > 86400000) {
				msg.reply(serifs.timer.tooLong);
				return true;
			}

			msg.reply(serifs.timer.set);

			const str = `${hours ? hoursQuery[0] : ''}${minutes ? minutesQuery[0] : ''}${seconds ? secondsQuery[0] : ''}`;

			setTimeout(() => {
				const name = msg.friend.name;
				msg.reply(serifs.timer.notify(str, name));
			}, time);

			return true;
		} else {
			return false;
		}
	}
}
