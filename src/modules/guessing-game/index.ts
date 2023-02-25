import autobind from 'autobind-decorator';
import * as loki from 'lokijs';
import Module from '@/module';
import Message from '@/message';
import serifs from '@/serifs';

export default class extends Module {
	public readonly name = 'guessingGame';

	private guesses: loki.Collection<{
		userId: string;
		secret: number;
		tries: number[];
		isEnded: boolean;
		startedAt: number;
		endedAt: number | null;
	}>;

	@autobind
	public install() {
		this.guesses = this.ai.getCollection('guessingGame', {
			indices: ['userId']
		});

		return {
			mentionHook: this.mentionHook,
			contextHook: this.contextHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (!msg.includes(['数当て', '数あて'])) return false;

		const exist = this.guesses.findOne({
			userId: msg.userId,
			isEnded: false
		});

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
			this.subscribeReply(msg.userId, reply.id);
		});

		return true;
	}

	@autobind
	private async contextHook(key: any, msg: Message) {
		if (msg.text == null) return;

		const exist = this.guesses.findOne({
			userId: msg.userId,
			isEnded: false
		});

		 // 処理の流れ上、実際にnullになることは無さそうだけど一応
		if (exist == null) {
			this.unsubscribeReply(key);
			return;
		}

		if (msg.text.includes('やめ')) {
			msg.reply(serifs.guessingGame.cancel);
			exist.isEnded = true;
			exist.endedAt = Date.now();
			this.guesses.update(exist);
			this.unsubscribeReply(key);
			return;
		}

		const guess = msg.extractedText.match(/[0-9]+/);

		if (guess == null) {
			msg.reply(serifs.guessingGame.nan).then(reply => {
				this.subscribeReply(msg.userId, reply.id);
			});
			return;
		}

		if (guess.length > 3) return;

		const g = parseInt(guess[0], 10);
		const firsttime = exist.tries.indexOf(g) === -1;

		exist.tries.push(g);

		let text: string;
		let end = false;

		if (exist.secret < g) {
			text = firsttime
				? serifs.guessingGame.less(g.toString())
				: serifs.guessingGame.lessAgain(g.toString());
		} else if (exist.secret > g) {
			text = firsttime
				? serifs.guessingGame.grater(g.toString())
				: serifs.guessingGame.graterAgain(g.toString());
		} else {
			end = true;
			text = serifs.guessingGame.congrats(exist.tries.length.toString());
		}

		if (end) {
			exist.isEnded = true;
			exist.endedAt = Date.now();
			this.unsubscribeReply(key);
		}

		this.guesses.update(exist);

		msg.reply(text).then(reply => {
			if (!end) {
				this.subscribeReply(msg.userId, reply.id);
			}
		});
	}
}
