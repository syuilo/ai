import autobind from 'autobind-decorator';
import * as loki from 'lokijs';
import Module from '@/module';
import Message from '@/message';
import serifs from '@/serifs';
import { acct } from '@/utils/acct';

const NOTIFY_INTERVAL = 1000 * 60 * 60 * 12;

export default class extends Module {
	public readonly name = 'reminder';

	private reminds: loki.Collection<{
		userId: string;
		id: string;
		isDm: boolean;
		thing: string | null;
		quoteId: string | null;
		times: number; // 催促した回数(使うのか？)
		createdAt: number;
	}>;

	@autobind
	public install() {
		this.reminds = this.ai.getCollection('reminds', {
			indices: ['userId', 'id']
		});

		return {
			mentionHook: this.mentionHook,
			contextHook: this.contextHook,
			timeoutCallback: this.timeoutCallback,
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		let text = msg.extractedText.toLowerCase();
		if (!text.startsWith('remind') && !text.startsWith('todo')) return false;
		if (text.match(/^(.+?)\s(.+)/)) {
			text = text.replace(/^(.+?)\s/, '');
		} else {
			text = '';
		}

		const separatorIndex = text.indexOf(' ') > -1 ? text.indexOf(' ') : text.indexOf('\n');
		const thing = text.substr(separatorIndex + 1).trim();

		if (thing === '' && msg.quoteId == null) {
			msg.reply(serifs.reminder.invalid);
			return true;
		}

		const remind = this.reminds.insertOne({
			id: msg.id,
			userId: msg.userId,
			isDm: msg.isDm,
			thing: thing === '' ? null : thing,
			quoteId: msg.quoteId,
			times: 0,
			createdAt: Date.now(),
		});

		this.subscribeReply(msg.id, msg.isDm, msg.isDm ? msg.userId : msg.id, {
			id: remind!.id
		});

		// タイマーセット
		this.setTimeoutWithPersistence(NOTIFY_INTERVAL, {
			id: msg.id,
		});

		return {
			reaction: '🆗',
			immediate: true,
		};
	}

	@autobind
	private async contextHook(key: any, msg: Message, data: any) {
		if (msg.text == null) return;

		const remind = this.reminds.findOne({
			id: data.id,
		});

		if (remind == null) {
			this.unsubscribeReply(key);
			return;
		}

		const done = msg.includes(['done', 'やった']);
		const cancel = msg.includes(['やめる']);

		if (done || cancel) {
			this.unsubscribeReply(key);
			this.reminds.remove(remind);
			msg.reply(done ? serifs.reminder.done(msg.friend.name) : serifs.reminder.cancel);
			return;
		} else {
			if (msg.isDm) this.unsubscribeReply(key);
			return false;
		}
	}

	@autobind
	private async timeoutCallback(data) {
		const remind = this.reminds.findOne({
			id: data.id
		});
		if (remind == null) return;

		remind.times++;
		this.reminds.update(remind);

		const friend = this.ai.lookupFriend(remind.userId);
		if (friend == null) return; // 処理の流れ上、実際にnullになることは無さそうだけど一応

		let reply;
		if (remind.isDm) {
			this.ai.sendMessage(friend.userId, {
				text: serifs.reminder.notifyWithThing(remind.thing, friend.name)
			});
		} else {
			reply = await this.ai.post({
				renoteId: remind.thing == null && remind.quoteId ? remind.quoteId : remind.id,
				text: acct(friend.doc.user) + ' ' + serifs.reminder.notify(friend.name)
			});
		}

		this.subscribeReply(remind.id, remind.isDm, remind.isDm ? remind.userId : reply.id, {
			id: remind.id
		});

		// タイマーセット
		this.setTimeoutWithPersistence(NOTIFY_INTERVAL, {
			id: remind.id,
		});
	}
}
