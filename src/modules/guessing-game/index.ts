import * as loki from 'lokijs';
import 藍 from '../../ai';
import IModule from '../../module';
import MessageLike from '../../message-like';
import serifs from '../../serifs';

export default class GuessingGameModule implements IModule {
	public name = 'guessingGame';
	private ai: 藍;
	private guesses: loki.Collection<{
		userId: string;
		secret: number;
		tries: number[];
		isEnded: boolean;
		startedAt: number;
		endedAt: number;
	}>;

	public install = (ai: 藍) => {
		this.ai = ai;

		//#region Init DB
		this.guesses = this.ai.db.getCollection('guessingGame');
		if (this.guesses === null) {
			this.guesses = this.ai.db.addCollection('guessingGame', {
				indices: ['userId']
			});
		}
		//#endregion
	}

	public onMention = (msg: MessageLike) => {
		if (msg.text && (msg.text.includes('数当て') || msg.text.includes('数あて'))) {
			const exist = this.guesses.findOne({
				userId: msg.userId,
				isEnded: false
			});

			if (!msg.isMessage) {
				if (exist != null) {
					msg.reply(serifs.guessingGame.arleadyStarted);
				} else {
					msg.reply(serifs.guessingGame.plzDm);
				}

				return true;
			}

			const secret = Math.floor(Math.random() * 100);

			this.guesses.insertOne({
				userId: msg.userId,
				secret: secret,
				tries: [],
				isEnded: false,
				startedAt: Date.now(),
				endedAt: null
			});

			msg.reply(serifs.guessingGame.started).then(reply => {
				this.ai.subscribeReply(this, msg.userId, msg.isMessage, msg.isMessage ? msg.userId : reply.id);
			});

			return true;
		} else {
			return false;
		}
	}

	public onReplyThisModule = (msg: MessageLike) => {
		if (msg.text == null) return;

		const exist = this.guesses.findOne({
			userId: msg.userId,
			isEnded: false
		});

		if (msg.text.includes('やめ')) {
			msg.reply(serifs.guessingGame.cancel);
			exist.isEnded = true;
			exist.endedAt = Date.now();
			this.guesses.update(exist);
			this.ai.unsubscribeReply(this, msg.userId);
			return;
		}

		const guess = msg.text.toLowerCase().replace(this.ai.account.username.toLowerCase(), '').match(/[0-9]+/);

		if (guess == null) {
			msg.reply(serifs.guessingGame.nan).then(reply => {
				this.ai.subscribeReply(this, msg.userId, msg.isMessage, reply.id);
			});
		} else {
			if (guess.length > 3) return;

			const g = parseInt(guess, 10);

			const firsttime = exist.tries.indexOf(g) === -1;

			exist.tries.push(g);

			let text: string;
			let end = false;

			if (exist.secret < g) {
				text = firsttime
					? serifs.guessingGame.less.replace('$', g.toString())
					: serifs.guessingGame.lessAgain.replace('$', g.toString());
			} else if (exist.secret > g) {
				text = firsttime
					? serifs.guessingGame.grater.replace('$', g.toString())
					: serifs.guessingGame.graterAgain.replace('$', g.toString());
			} else {
				end = true;
				text = serifs.guessingGame.congrats.replace('{tries}', exist.tries.length.toString());
			}

			if (end) {
				exist.isEnded = true;
				exist.endedAt = Date.now();
				this.ai.unsubscribeReply(this, msg.userId);
			}

			this.guesses.update(exist);

			msg.reply(text).then(reply => {
				if (!end) {
					this.ai.subscribeReply(this, msg.userId, msg.isMessage, reply.id);
				}
			});
		}
	}
}
