import 藍 from '../../ai';
import IModule from '../../module';
import Friend from '../../friend';
import serifs from '../../serifs';

function zeroPadding(num: number, length: number): string {
	return ('0000000000' + num).slice(-length);
}

export default class BirthdayModule implements IModule {
	public readonly name = 'birthday';

	private ai: 藍;

	public install = (ai: 藍) => {
		this.ai = ai;

		this.crawleBirthday();
		setInterval(this.crawleBirthday, 1000 * 60 * 3);
	}

	/**
	 * 誕生日のユーザーがいないかチェック(いたら祝う)
	 */
	private crawleBirthday = () => {
		const now = new Date();
		const m = now.getMonth();
		const d = now.getDate();
		// Misskeyの誕生日は 2018-06-16 のような形式
		const today = `${zeroPadding(m + 1, 2)}-${zeroPadding(d, 2)}`;

		const birthFriends = this.ai.friends.find({
			'user.profile.birthday': { '$regex': new RegExp('-' + today + '$') }
		} as any);

		birthFriends.forEach(f => {
			const friend = new Friend(this.ai, { doc: f });

			// 親愛度が3以上必要
			if (friend.love < 3) return;

			const data = friend.getPerModulesData(this);

			if (data.lastBirthdayChecked == today) return;

			data.lastBirthdayChecked = today;
			friend.setPerModulesData(this, data);

			const text = serifs.birthday.happyBirthday(friend.name);

			this.ai.sendMessage(friend.userId, {
				text: text
			});
		});
	}
}
