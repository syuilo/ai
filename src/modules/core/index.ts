import * as loki from 'lokijs';
import 藍 from '../../ai';
import IModule from '../../module';
import MessageLike from '../../message-like';
import serifs from '../../serifs';
import Friend from '../../friend';
import getDate from '../../utils/get-date';

function zeroPadding(num: number, length: number): string {
	return ('0000000000' + num).slice(-length);
}

export default class CoreModule implements IModule {
	public name = 'core';
	private ai: 藍;

	public install = (ai: 藍) => {
		this.ai = ai;

		this.crawleBirthday();
		setInterval(this.crawleBirthday, 1000 * 60 * 3);
	}

	public onMention = (msg: MessageLike) => {
		if (!msg.text) return false;

		return this.setName(msg) || this.greet(msg) || this.nadenade(msg) || this.kawaii(msg);
	}

	/**
	 * 誕生日のユーザーがいないかチェック(いたら祝う)
	 */
	private crawleBirthday = () => {
		const now = new Date();
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();
		// Misskeyの誕生日は 2018-06-16 のような形式
		const today = `${zeroPadding(m + 1, 2)}-${d}`;

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

			const text = friend.name ? serifs.core.happyBirthdayWithName.replace('{name}', friend.name) : serifs.core.happyBirthday;

			this.ai.sendMessage(friend.userId, {
				text: text
			});
		});
	}

	private setName = (msg: MessageLike): boolean => {
		if (!msg.text) return false;
		if (!msg.text.includes('って呼んで')) return false;
		if (msg.text.startsWith('って呼んで')) return false;

		// メッセージのみ
		if (!msg.isMessage) return true;

		if (msg.friend.love < 5) {
			msg.reply(serifs.core.requireMoreLove);
			return true;
		}

		const name = msg.text.match(/^(.+?)って呼んで/)[1];

		if (name.length > 10) {
			msg.reply(serifs.core.tooLong);
			return true;
		}

		if (name.includes('@')) {
			msg.reply(serifs.core.invalidName);
			return true;
		}

		const titles = ['さん', 'くん', '君', 'ちゃん', '様', '先生'];

		const withSan = titles.some(t => name.endsWith(t));

		if (withSan) {
			msg.friend.updateName(name);
			msg.reply(serifs.core.setNameOk.replace('{name}', name));
		} else {
			msg.reply(serifs.core.san).then(reply => {
				this.ai.subscribeReply(this, msg.userId, msg.isMessage, msg.isMessage ? msg.userId : reply.id, {
					name: name
				});
			});
		}

		return true;
	}

	private greet = (msg: MessageLike): boolean => {
		if (!msg.text) return false;

		const incLove = () => {
			const today = getDate();

			const data = msg.friend.getPerModulesData(this);

			if (data.lastGreetedAt == today) return;

			data.lastGreetedAt = today;
			msg.friend.setPerModulesData(this, data);

			msg.friend.incLove();
		};

		if (msg.text.includes('おはよ')) {
			if (msg.friend.name) {
				msg.reply(serifs.core.goodMorningWithName.replace('{name}', msg.friend.name));
			} else {
				msg.reply(serifs.core.goodMorning);
			}

			incLove();

			return true;
		} else if (msg.text.includes('おやすみ')) {
			if (msg.friend.name) {
				msg.reply(serifs.core.goodNightWithName.replace('{name}', msg.friend.name));
			} else {
				msg.reply(serifs.core.goodNight);
			}

			incLove();

			return true;
		} else {
			return false;
		}
	}

	private nadenade = (msg: MessageLike): boolean => {
		if (!msg.text) return false;
		if (!msg.text.includes('なでなで')) return false;

		// メッセージのみ
		if (!msg.isMessage) return true;

		//#region 1日に1回だけ親愛度を上げる
		const today = getDate();

		const data = msg.friend.getPerModulesData(this);

		if (data.lastNadenadeAt != today) {
			data.lastNadenadeAt = today;
			msg.friend.setPerModulesData(this, data);

			msg.friend.incLove();
		}
		//#endregion

		msg.reply(
			msg.friend.love >= 5 ? serifs.core.nadenade2 :
			msg.friend.love >= 10 ? serifs.core.nadenade3 :
			serifs.core.nadenade1
		);

		return true;
	}

	private kawaii = (msg: MessageLike): boolean => {
		if (!msg.text) return false;
		if (!msg.text.includes('かわいい') && !msg.text.includes('可愛い')) return false;

		msg.reply(serifs.core.kawaii);

		return true;
	}

	public onReplyThisModule = (msg: MessageLike, data: any) => {
		if (msg.text == null) return;

		const done = () => {
			msg.reply(serifs.core.setNameOk.replace('{name}', msg.friend.name));
			this.ai.unsubscribeReply(this, msg.userId);
		};

		if (msg.text.includes('はい')) {
			msg.friend.updateName(data.name + 'さん');
			done();
		} else if (msg.text.includes('いいえ')) {
			msg.friend.updateName(data.name);
			done();
		} else {
			msg.reply(serifs.core.yesOrNo).then(reply => {
				this.ai.subscribeReply(this, msg.userId, msg.isMessage, reply.id, data);
			});
		}
	}
}
