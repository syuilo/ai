import autobind from 'autobind-decorator';
import Message from '../../message';
import Module from '../../module';
import serifs from '../../serifs';
import { genItem } from '../../vocabulary';
import config from '../../config';
import { Note } from '../../misskey/note';

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
			['珍しそうなもの', 'みなさんは、どれがいちばん珍しいと思いますか？'],
			['美味しそうなもの', 'みなさんは、どれがいちばん美味しいと思いますか？'],
			['重そうなもの', 'みなさんは、どれがいちばん重いと思いますか？'],
			['欲しいもの', 'みなさんは、どれがいちばん欲しいですか？'],
			['無人島に持っていきたいもの', 'みなさんは、無人島にひとつ持っていけるとしたらどれにしますか？'],
			['家に飾りたいもの', 'みなさんは、家に飾るとしたらどれにしますか？'],
			['売れそうなもの', 'みなさんは、どれがいちばん売れそうだと思いますか？'],
			['降ってきてほしいもの', 'みなさんは、どれが空から降ってきてほしいですか？'],
			['携帯したいもの', 'みなさんは、どれを携帯したいですか？'],
			['商品化したいもの', 'みなさんは、商品化するとしたらどれにしますか？'],
			['発掘されそうなもの', 'みなさんは、遺跡から発掘されそうなものはどれだと思いますか？'],
			['良い香りがしそうなもの', 'みなさんは、どれがいちばんいい香りがすると思いますか？'],
			['高値で取引されそうなもの', 'みなさんは、どれがいちばん高値で取引されると思いますか？'],
			['地球周回軌道上にありそうなもの', 'みなさんは、どれが地球周回軌道上を漂っていそうだと思いますか？'],
			['プレゼントしたいもの', 'みなさんは、私にプレゼントしてくれるとしたらどれにしますか？'],
			['プレゼントされたいもの', 'みなさんは、プレゼントでもらうとしたらどれにしますか？'],
			['私が持ってそうなもの', 'みなさんは、私が持ってそうなものはどれだと思いますか？'],
			['そして輝くウルトラ', 'そして輝くウルトラ'],
		];

		const poll = polls[Math.floor(Math.random() * polls.length)];

		const choices = poll[0] === 'そして輝くウルトラ' ? [
			'そう',
			'どちらかというとそう',
			'どちらでもない',
			'どちらかというとそうではない',
			'そうではない',
			'わからない・回答しない',
		] : [
			genItem(),
			genItem(),
			genItem(),
			genItem(),
		];

		const note = await this.ai.post({
			text: poll[1],
			poll: {
				choices,
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
		const note: Note = await this.ai.api('notes/show', { noteId });

		const choices = note.poll!.choices;

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
				text: `結果は${mostVotedChoice.votes}票を獲得した「${mostVotedChoice.text}」でした！`,
				renoteId: noteId,
			});
		}
	}
}
