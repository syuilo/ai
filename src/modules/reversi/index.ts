import * as childProcess from 'child_process';
import autobind from 'autobind-decorator';
import Module from '@/module';
import serifs from '@/serifs';
import config from '@/config';
import Message from '@/message';
import Friend from '@/friend';
import getDate from '@/utils/get-date';

export default class extends Module {
	public readonly name = 'reversi';

	/**
	 * リバーシストリーム
	 */
	private reversiConnection?: any;

	@autobind
	public install() {
		if (!config.reversiEnabled) return {};

		this.reversiConnection = this.ai.connection.useSharedConnection('gamesReversi');

		// 招待されたとき
		this.reversiConnection.on('invited', msg => this.onReversiInviteMe(msg.parent));

		// マッチしたとき
		this.reversiConnection.on('matched', msg => this.onReversiGameStart(msg));

		if (config.reversiEnabled) {
			const mainStream = this.ai.connection.useSharedConnection('main');
			mainStream.on('pageEvent', msg => {
				if (msg.event === 'inviteReversi') {
					this.ai.api('games/reversi/match', {
						userId: msg.user.id
					});
				}
			});
		}

		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (msg.includes(['リバーシ', 'オセロ', 'reversi', 'othello'])) {
			if (config.reversiEnabled) {
				msg.reply(serifs.reversi.ok);

				this.ai.api('games/reversi/match', {
					userId: msg.userId
				});
			} else {
				msg.reply(serifs.reversi.decline);
			}

			return true;
		} else {
			return false;
		}
	}

	@autobind
	private async onReversiInviteMe(inviter: any) {
		this.log(`Someone invited me: @${inviter.username}`);

		if (config.reversiEnabled) {
			// 承認
			const game = await this.ai.api('games/reversi/match', {
				userId: inviter.id
			});

			this.onReversiGameStart(game);
		} else {
			// todo (リバーシできない旨をメッセージで伝えるなど)
		}
	}

	@autobind
	private onReversiGameStart(game: any) {
		this.log('enter reversi game room');

		// ゲームストリームに接続
		const gw = this.ai.connection.connectToChannel('gamesReversiGame', {
			gameId: game.id
		});

		// フォーム
		const form = [{
			id: 'publish',
			type: 'switch',
			label: '藍が対局情報を投稿するのを許可',
			value: true
		}, {
			id: 'strength',
			type: 'radio',
			label: '強さ',
			value: 3,
			items: [{
				label: '接待',
				value: 0
			}, {
				label: '弱',
				value: 2
			}, {
				label: '中',
				value: 3
			}, {
				label: '強',
				value: 4
			}, {
				label: '最強',
				value: 5
			}]
		}];

		//#region バックエンドプロセス開始
		const ai = childProcess.fork(__dirname + '/back.js');

		// バックエンドプロセスに情報を渡す
		ai.send({
			type: '_init_',
			body: {
				game: game,
				form: form,
				account: this.ai.account
			}
		});

		ai.on('message', (msg: Record<string, any>) => {
			if (msg.type == 'put') {
				gw.send('set', {
					pos: msg.pos
				});
			} else if (msg.type == 'ended') {
				gw.dispose();

				this.onGameEnded(game);
			}
		});

		// ゲームストリームから情報が流れてきたらそのままバックエンドプロセスに伝える
		gw.addListener('*', message => {
			ai.send(message);
		});
		//#endregion

		// フォーム初期化
		setTimeout(() => {
			gw.send('initForm', form);
		}, 1000);

		// どんな設定内容の対局でも受け入れる
		setTimeout(() => {
			gw.send('accept', {});
		}, 2000);
	}

	@autobind
	private onGameEnded(game: any) {
		const user = game.user1Id == this.ai.account.id ? game.user2 : game.user1;

		//#region 1日に1回だけ親愛度を上げる
		const today = getDate();

		const friend = new Friend(this.ai, { user: user });

		const data = friend.getPerModulesData(this);

		if (data.lastPlayedAt != today) {
			data.lastPlayedAt = today;
			friend.setPerModulesData(this, data);

			friend.incLove();
		}
		//#endregion
	}
}
