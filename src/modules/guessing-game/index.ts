import { bindThis } from '@/decorators.js';
import loki from 'lokijs';
import Module, { InstalledModule } from '@/module.js';
import Message from '@/message.js';
import serifs from '@/serifs.js';
import 藍, { InstallerResult } from '@/ai.js';

type Guesses = loki.Collection<{
	userId: string;
	secret: number;
	tries: number[];
	isEnded: boolean;
	startedAt: number;
	endedAt: number | null;
}>

export default class extends Module {
	public readonly name = 'guessingGame';

	@bindThis
	public install(ai: 藍) {
		const guesses = ai.getCollection('guessingGame', {
			indices: ['userId']
		});

		return new Installed(this, ai, guesses);
	}
}

class Installed extends InstalledModule implements InstallerResult {
	private guesses: Guesses;

	constructor(module: Module, ai: 藍, guesses: Guesses) {
		super(module, ai);
		this.guesses = guesses;
	}

	@bindThis
	public async mentionHook(msg: Message) {
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

	@bindThis
	public async contextHook(key: any, msg: Message) {
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
			this.ai.unsubscribeReply(this.module, key);
		}

		this.guesses.update(exist);

		msg.reply(text).then(reply => {
			if (!end) {
				this.ai.subscribeReply(this.module, msg.userId, reply.id);
			}
		});
	}
}
