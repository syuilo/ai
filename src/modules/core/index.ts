import * as loki from 'lokijs';
import 藍 from '../../ai';
import IModule from '../../module';
import MessageLike from '../../message-like';
import serifs from '../../serifs';

export default class CoreModule implements IModule {
	public name = 'core';
	private ai: 藍;

	public install = (ai: 藍) => {
		this.ai = ai;
	}

	public onMention = (msg: MessageLike) => {
		if (!msg.text) return false;

		if (msg.text.includes('って呼んで') && !msg.text.startsWith('って呼んで')) {
			const name = msg.text.match(/^(.+?)って呼んで/)[1];

			if (name.length > 10) {
				msg.reply(serifs.core.tooLong);
				return true;
			}

			const withSan =
				name.endsWith('さん') ||
				name.endsWith('くん') ||
				name.endsWith('君') ||
				name.endsWith('ちゃん') ||
				name.endsWith('様');

			if (withSan) {
				msg.friend.name = name;
				this.ai.friends.update(msg.friend);
				msg.reply(serifs.core.setNameOk.replace('{name}', name));
			} else {
				msg.reply(serifs.core.san).then(reply => {
					this.ai.subscribeReply(this, msg.userId, msg.isMessage, msg.isMessage ? msg.userId : reply.id, {
						name: name
					});
				});
			}

			return true;
		} else if (msg.text.includes('おはよう')) {
			if (msg.friend.name) {
				msg.reply(serifs.core.goodMorningWithName.replace('{name}', msg.friend.name));
			} else {
				msg.reply(serifs.core.goodMorning);
			}

			return true;
		} else if (msg.text.includes('おやすみ')) {
			if (msg.friend.name) {
				msg.reply(serifs.core.goodNightWithName.replace('{name}', msg.friend.name));
			} else {
				msg.reply(serifs.core.goodNight);
			}

			return true;
		} else {
			return false;
		}
	}

	public onReplyThisModule = (msg: MessageLike, data: any) => {
		if (msg.text == null) return;

		const done = () => {
			this.ai.friends.update(msg.friend);
			msg.reply(serifs.core.setNameOk.replace('{name}', msg.friend.name));
			this.ai.unsubscribeReply(this, msg.userId);
		};

		if (msg.text.includes('はい')) {
			msg.friend.name = data.name + 'さん';
			done();
		} else if (msg.text.includes('いいえ')) {
			msg.friend.name = data.name;
			done();
		} else {
			msg.reply(serifs.core.yesOrNo).then(reply => {
				this.ai.subscribeReply(this, msg.userId, msg.isMessage, reply.id, data);
			});
		}
	}
}
