import autobind from 'autobind-decorator';
import Message from '../../message';
import Module from '../../module';
import serifs from '../../serifs';
import { genItem } from '../../vocabulary';
import config from '../../config';

export default class extends Module {
	public readonly name = 'poll';

	@autobind
	public install() {
		setInterval(() => {
			if (Math.random() < 0.1) {
				this.post();
			}
		}, 1000 * 60 * 60);

		return {
			mentionHook: this.mentionHook,
			timeoutCallback: this.timeoutCallback,
		};
	}

	@autobind
	private async post() {
		const duration = 1000 * 60 * 30;

		const polls = [ // TODO: Extract serif
			['いちばん珍しそうなもの', 'みなさんは、どれがいちばん珍しいと思いますか？ ヽ(・∀・)'],
			['いちばん美味しそうなもの', 'みなさんは、どれがいちばん美味しいと思いますか？ ヽ(・∀・)'],
			['いちばん重そうなもの', 'みなさんは、どれがいちばん重いと思いますか？ ヽ(・∀・)'],
			['いちばん欲しいもの', 'みなさんは、どれがいちばん欲しいですか？ ヽ(・∀・)'],
			['無人島に持っていきたいもの', 'みなさんは、無人島にひとつ持っていけるとしたらどれにしますか？ ヽ(・∀・)'],
		];

		const poll = polls[Math.floor(Math.random() * polls.length)];

		const note = await this.ai.post({
			text: poll[1],
			poll: {
				choices: [
					genItem(),
					genItem(),
					genItem(),
					genItem(),
				],
				expiredAfter: duration,
				multiple: false,
			}
		});

		// タイマーセット
		this.setTimeoutWithPersistence(duration + 3000, {
			title: poll[0],
			noteId: note.id,
		});
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (!msg.or(['/poll']) || msg.user.username !== config.master) {
			return false;
		} else {
			this.log('Manualy poll requested');
		}

		this.post();

		return true;
	}

	@autobind
	private async timeoutCallback({ title, noteId }) {
		const note = await this.ai.api('notes/show', { noteId });

		const choices = note.poll.choices;

		let mostVotedChoice;

		for (const choice of choices) {
			if (mostVotedChoice == null) {
				mostVotedChoice = choice;
				continue;
			}

			// TODO: 同数一位のハンドリング
			if (choice.votes > mostVotedChoice.votes) {
				mostVotedChoice = choice;
			}
		}

		if (mostVotedChoice.votes === 0) {
			this.ai.post({ // TODO: Extract serif
				text: '投票はありませんでした',
				renoteId: noteId,
			});
		} else {
			this.ai.post({ // TODO: Extract serif
				cw: `${title}アンケートの結果発表です！`,
				text: `結果は「${mostVotedChoice.text}」でした！`,
				renoteId: noteId,
			});
		}
	}
}
