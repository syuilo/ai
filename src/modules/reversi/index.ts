import * as childProcess from 'child_process';
import 藍 from '../../ai';
import IModule from '../../module';
import serifs from '../../serifs';
import config from '../../config';
import MessageLike from '../../message-like';
import * as WebSocket from 'ws';
import Friend from '../../friend';
import getDate from '../../utils/get-date';

export default class ReversiModule implements IModule {
	public readonly name = 'reversi';

	private ai: 藍;

	/**
	 * リバーシストリーム
	 */
	private reversiConnection?: any;

	public install = (ai: 藍) => {
		if (!config.reversiEnabled) return;

		this.ai = ai;

		this.reversiConnection = this.ai.connection.useSharedConnection('gamesReversi');

		// 招待されたとき
		this.reversiConnection.on('invited', msg => this.onReversiInviteMe(msg.parent));

		// マッチしたとき
		this.reversiConnection.on('matched', msg => this.onReversiGameStart(msg));
	}

	public onMention = (msg: MessageLike) => {
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

	private onReversiInviteMe = async (inviter: any) => {
		console.log(`Someone invited me: @${inviter.username}`);

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

	private onReversiGameStart = (game: any) => {
		// ゲームストリームに接続
		const gw = this.ai.connection.connectToChannel('gamesReversiGame', {
			game: game.id
		});

		function send(msg) {
			try {
				gw.send(JSON.stringify(msg));
			} catch (e) {
				console.error(e);
			}
		}

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
			game,
			form,
			account: this.ai.account
		});

		ai.on('message', msg => {
			if (msg.type == 'put') {
				send({
					type: 'set',
					pos: msg.pos
				});
			} else if (msg.type == 'ended') {
				gw.dispose();

				this.onGameEnded(game);
			}
		});

		// ゲームストリームから情報が流れてきたらそのままバックエンドプロセスに伝える
		gw.addEventListener('*', message => {
			ai.send(message);
		});
		//#endregion

		// フォーム初期化
		setTimeout(() => {
			send({
				type: 'initForm',
				body: form
			});
		}, 1000);

		// どんな設定内容の対局でも受け入れる
		setTimeout(() => {
			send({
				type: 'accept'
			});
		}, 2000);
	}

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
