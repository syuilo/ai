import autobind from 'autobind-decorator';
import Module from '../../module';
import Message from '../../message';
import serifs from '../../serifs';

const titles = ['さん', 'くん', '君', 'ちゃん', '様', '先生'];

const invalidChars = ['@', '#', '*', ':', '(', '[', ' ', '　'];

export default class extends Module {
	public readonly name = 'core';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook,
			contextHook: this.contextHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (!msg.text) return false;

		return (
			this.transferBegin(msg) ||
			this.transferEnd(msg) ||
			this.setName(msg) ||
			this.modules(msg)
		);
	}

	@autobind
	private transferBegin(msg: Message): boolean  {
		if (!msg.text) return false;
		if (!msg.includes(['引継', '引き継ぎ', '引越', '引っ越し'])) return false;

		// メッセージのみ
		if (!msg.isDm) {
			msg.reply(serifs.core.transferNeedDm);
			return true;
		}

		const code = msg.friend.generateTransferCode();

		msg.reply(serifs.core.transferCode(code));

		return true;
	}

	@autobind
	private transferEnd(msg: Message): boolean  {
		if (!msg.text) return false;
		if (!msg.text.startsWith('「') || !msg.text.endsWith('」')) return false;

		const code = msg.text.substring(1, msg.text.length - 1);

		const succ = msg.friend.transferMemory(code);

		if (succ) {
			msg.reply(serifs.core.transferDone(msg.friend.name));
		} else {
			msg.reply(serifs.core.transferFailed);
		}

		return true;
	}

	@autobind
	private setName(msg: Message): boolean  {
		if (!msg.text) return false;
		if (!msg.text.includes('って呼んで')) return false;
		if (msg.text.startsWith('って呼んで')) return false;

		// メッセージのみ
		if (!msg.isDm) return true;

		if (msg.friend.love < 5) {
			msg.reply(serifs.core.requireMoreLove);
			return true;
		}

		const name = msg.text.match(/^(.+?)って呼んで/)[1];

		if (name.length > 10) {
			msg.reply(serifs.core.tooLong);
			return true;
		}

		if (invalidChars.some(c => name.includes(c))) {
			msg.reply(serifs.core.invalidName);
			return true;
		}

		const withSan = titles.some(t => name.endsWith(t));

		if (withSan) {
			msg.friend.updateName(name);
			msg.reply(serifs.core.setNameOk(name));
		} else {
			msg.reply(serifs.core.san).then(reply => {
				this.subscribeReply(msg.userId, msg.isDm, msg.isDm ? msg.userId : reply.id, {
					name: name
				});
			});
		}

		return true;
	}

	@autobind
	private modules(msg: Message): boolean  {
		if (!msg.text) return false;
		if (!msg.or(['modules'])) return false;

		let text = '```\n';

		for (const m of this.ai.modules) {
			text += `${m.name}\n`;
		}

		text += '```';

		msg.reply(text);

		return true;
	}

	@autobind
	private async contextHook(msg: Message, data: any) {
		if (msg.text == null) return;

		const done = () => {
			msg.reply(serifs.core.setNameOk(msg.friend.name));
			this.unsubscribeReply(msg.userId);
		};

		if (msg.text.includes('はい')) {
			msg.friend.updateName(data.name + 'さん');
			done();
		} else if (msg.text.includes('いいえ')) {
			msg.friend.updateName(data.name);
			done();
		} else {
			msg.reply(serifs.core.yesOrNo).then(reply => {
				this.subscribeReply(msg.userId, msg.isDm, reply.id, data);
			});
		}
	}
}
