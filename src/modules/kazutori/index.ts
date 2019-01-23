import autobind from 'autobind-decorator';
import * as loki from 'lokijs';
import Module from '../../module';
import Message from '../../message';
import serifs from '../../serifs';
import getCollection from '../../utils/get-collection';
import { User } from '../../misskey/user';

type Game = {
	votes: {
		user: User;
		number: number;
	}[];
	isEnded: boolean;
	startedAt: number;
	postId: string;
};

export default class extends Module {
	public readonly name = 'kazutori';

	private games: loki.Collection<Game>;

	@autobind
	public install() {
		this.games = getCollection(this.ai.db, 'kazutori');

		this.crawleGameEnd();
		setInterval(this.crawleGameEnd, 1000);

		return {
			mentionHook: this.mentionHook,
			contextHook: this.contextHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (!msg.includes(['数取り'])) return false;

		const games = this.games.find({});

		const recentGame = games.length == 0 ? null : games[games.length - 1];

		if (recentGame) {
			// 現在アクティブなゲームがある場合
			if (!recentGame.isEnded) {
				msg.reply(serifs.kazutori.alreadyStarted, null, recentGame.postId);
				return true;
			}

			// 直近のゲームから1時間経ってない場合
			if (Date.now() - recentGame.startedAt < 1000 * 60 * 60) {
				msg.reply(serifs.kazutori.matakondo);
				return true;
			}
		}

		const post = await this.ai.post({
			text: serifs.kazutori.intro
		});

		this.games.insertOne({
			votes: [],
			isEnded: false,
			startedAt: Date.now(),
			postId: post.id
		});

		this.subscribeReply(null, false, post.id);

		this.log('New kazutori game started');

		return true;
	}

	@autobind
	private async contextHook(msg: Message) {
		if (msg.text == null) return;

		const game = this.games.findOne({
			isEnded: false
		});

		// 既に数字を取っていたら
		if (game.votes.some(x => x.user.id == msg.userId)) return;

		const match = msg.text.match(/[0-9]+/);
		if (match == null) return;

		const num = parseInt(match[0], 10);

		// 整数じゃない
		if (!Number.isInteger(num)) return;

		// 範囲外
		if (num < 0 || num > 100) return;

		this.log(`Voted ${num} by ${msg.user.id}`);

		game.votes.push({
			user: msg.user,
			number: num
		});

		this.games.update(game);
	}

	/**
	 * 終了すべきゲームがないかチェック
	 */
	@autobind
	private crawleGameEnd() {
		const game = this.games.findOne({
			isEnded: false
		});

		if (game == null) return;

		// ゲーム開始から3分以上経過していたら
		if (Date.now() - game.startedAt >= 1000 * 60 * 3) {
			this.finish(game);
		}
	}

	/**
	 * ゲームを終わらせる
	 */
	@autobind
	private finish(game: Game) {
		game.isEnded = true;
		this.games.update(game);

		this.log('Kazutori game finished');

		// お流れ
		if (game.votes.length <= 1) {
			this.ai.post({
				text: serifs.kazutori.onagare,
				renoteId: game.postId
			});

			return;
		}

		function acct(user: User): string {
			return user.host ? `@${user.username}@${user.host}` : `@${user.username}`;
		}

		let results: string[] = [];

		let winner: User = null;

		for (let i = 100; i >= 0; i--) {
			const users = game.votes.filter(x => x.number == i).map(x => x.user);
			if (users.length == 1) {
				if (winner == null) {
					winner = users[0];
					results.push(`${i == 100 ? '💯' : '🎉'} ${i}: ${acct(users[0])}`);
				} else {
					results.push(`➖ ${i}: ${acct(users[0])}`);
				}
			} else if (users.length > 1) {
				results.push(`❌ ${i}: ${users.map(u => acct(u)).join(' ')}`);
			}
		}

		const text = results.join('\n') + '\n\n' + (winner
			? serifs.kazutori.finishWithWinner(acct(winner))
			: serifs.kazutori.finishWithNoWinner);

		this.ai.post({
			text: text,
			cw: serifs.kazutori.finish,
			renote: game.postId
		});

		this.unsubscribeReply(null);
	}
}
