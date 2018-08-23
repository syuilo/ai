import 藍 from '../../ai';
import IModule from '../../module';
import MessageLike from '../../message-like';
import serifs from '../../serifs';
import db from '../../memory';

export const guesses = db.addCollection<{
	userId: string;
	secret: number;
	tries: number[];
	isEnded: boolean;
	startedAt: number;
	endedAt: number;
}>('guessingGame', {
	indices: ['userId']
});

export default class GuessingGameModule implements IModule {
	public name = 'guessingGame';
	private ai: 藍;

	public install = (ai: 藍) => {
		this.ai = ai;
	}

	public onMention = (msg: MessageLike) => {
		if (msg.text && (msg.text.includes('数当て') || msg.text.includes('数あて'))) {
			const exist = guesses.findOne({
				userId: msg.userId,
				isEnded: false
			});

			if (!msg.isMessage) {
				if (exist != null) {
					msg.reply(serifs.GUESSINGGAME_ARLEADY_STARTED);
				} else {
					msg.reply(serifs.GUESSINGGAME_PLZ_DM);
				}

				return true;
			}

			const secret = Math.floor(Math.random() * 100);

			guesses.insertOne({
				userId: msg.userId,
				secret: secret,
				tries: [],
				isEnded: false,
				startedAt: Date.now(),
				endedAt: null
			});

			msg.reply(serifs.GUESSINGGAME_STARTED).then(reply => {
				this.ai.subscribeReply(this, msg.userId, msg.isMessage, msg.isMessage ? msg.userId : reply.id);
			});

			return true;
		} else {
			return false;
		}
	}

	public onReplyThisModule = (msg: MessageLike) => {
		if (msg.text == null) return;

		const exist = guesses.findOne({
			userId: msg.userId,
			isEnded: false
		});

		if (msg.text.includes('やめ')) {
			msg.reply(serifs.GUESSINGGAME_CANCEL);
			exist.isEnded = true;
			exist.endedAt = Date.now();
			guesses.update(exist);
			this.ai.unsubscribeReply(this, msg.userId);
			return;
		}

		const guess = msg.text.toLowerCase().replace(this.ai.account.username.toLowerCase(), '').match(/[0-9]+/);

		if (guess == null) {
			msg.reply(serifs.GUESSINGGAME_NAN).then(reply => {
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
					? serifs.GUESSINGGAME_LESS.replace('$', g.toString())
					: serifs.GUESSINGGAME_LESS_AGAIN.replace('$', g.toString());
			} else if (exist.secret > g) {
				text = firsttime
					? serifs.GUESSINGGAME_GRATER.replace('$', g.toString())
					: serifs.GUESSINGGAME_GRATER_AGAIN.replace('$', g.toString());
			} else {
				end = true;
				text = serifs.GUESSINGGAME_CONGRATS.replace('{tries}', exist.tries.length.toString());
			}

			if (end) {
				exist.isEnded = true;
				exist.endedAt = Date.now();
				this.ai.unsubscribeReply(this, msg.userId);
			}

			guesses.update(exist);

			msg.reply(text).then(reply => {
				if (!end) {
					this.ai.subscribeReply(this, msg.userId, msg.isMessage, reply.id);
				}
			});
		}
	}
}
