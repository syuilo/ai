/**
 * -AI-
 * Botのフロントエンド(ストリームとの対話を担当)
 *
 * 対話と思考を同じプロセスで行うと、思考時間が長引いたときにストリームから
 * 切断されてしまうので、別々のプロセスで行うようにします
 */

import * as childProcess from 'child_process';
import * as WebSocket from 'ws';
import * as request from 'request-promise-native';

const config = require('../config.json');

const wsUrl = config.host.replace('http', 'ws');
const apiUrl = config.host + '/api';

/**
 * ホームストリーム
 */
const homeStream = new WebSocket(`${wsUrl}/?i=${config.i}`);

homeStream.addEventListener('open', () => {
	console.log('home stream opened');
});

homeStream.addEventListener('close', () => {
	console.log('home stream closed');
});

homeStream.addEventListener('message', message => {
	const msg = JSON.parse(message.data);

	// タイムライン上でなんか言われたまたは返信されたとき
	if (msg.type == 'mention' || msg.type == 'reply') {
		const note = msg.body;

		if (note.userId == config.id) return;

		// リアクションする
		setTimeout(() => {
			request.post(`${apiUrl}/notes/reactions/create`, {
				json: {
					i: config.i,
					noteId: note.id,
					reaction: 'love'
				}
			});
		}, 2000);

		if (note.text && note.text.indexOf('リバーシ') > -1) {
			setTimeout(() => {
				request.post(`${apiUrl}/notes/create`, {
					json: {
						i: config.i,
						replyId: note.id,
						text: '良いですよ～'
					}
				});

				invite(note.userId);
			}, 3000);
		}
	}

	// メッセージでなんか言われたとき
	if (msg.type == 'messaging_message') {
		const message = msg.body;
		if (message.text) {
			if (message.text.indexOf('リバーシ') > -1) {
				request.post(`${apiUrl}/messaging/messages/create`, {
					json: {
						i: config.i,
						userId: message.userId,
						text: '良いですよ～'
					}
				});

				invite(message.userId);
			}
		}
	}
});

// ユーザーを対局に誘う
function invite(userId) {
	request.post(`${apiUrl}/games/reversi/match`, {
		json: {
			i: config.i,
			userId: userId
		}
	});
}

/**
 * リバーシストリーム
 */
const reversiStream = new WebSocket(`${wsUrl}/games/reversi?i=${config.i}`);

reversiStream.addEventListener('open', () => {
	console.log('reversi stream opened');
});

reversiStream.addEventListener('close', () => {
	console.log('reversi stream closed');
});

reversiStream.addEventListener('message', message => {
	const msg = JSON.parse(message.data);

	// 招待されたとき
	if (msg.type == 'invited') {
		onInviteMe(msg.body.parent);
	}

	// マッチしたとき
	if (msg.type == 'matched') {
		gameStart(msg.body);
	}
});

/**
 * ゲーム開始
 * @param game ゲーム情報
 */
function gameStart(game) {
	// ゲームストリームに接続
	const gw = new WebSocket(`${wsUrl}/games/reversi-game?i=${config.i}&game=${game.id}`);

	gw.addEventListener('open', () => {
		console.log('reversi game stream opened');

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
			value: 2,
			items: [{
				label: '接待',
				value: 0
			}, {
				label: '弱',
				value: 1
			}, {
				label: '中',
				value: 2
			}, {
				label: '強',
				value: 3
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
			form
		});

		ai.on('message', msg => {
			if (msg.type == 'put') {
				gw.send(JSON.stringify({
					type: 'set',
					pos: msg.pos
				}));
			} else if (msg.type == 'close') {
				gw.close();
			}
		});

		// ゲームストリームから情報が流れてきたらそのままバックエンドプロセスに伝える
		gw.addEventListener('message', message => {
			const msg = JSON.parse(message.data);
			ai.send(msg);
		});
		//#endregion

		// フォーム初期化
		setTimeout(() => {
			gw.send(JSON.stringify({
				type: 'init-form',
				body: form
			}));
		}, 1000);

		// どんな設定内容の対局でも受け入れる
		setTimeout(() => {
			gw.send(JSON.stringify({
				type: 'accept'
			}));
		}, 2000);
	});

	gw.addEventListener('close', () => {
		console.log('reversi game stream closed');
	});
}

/**
 * リバーシの対局に招待されたとき
 * @param inviter 誘ってきたユーザー
 */
async function onInviteMe(inviter) {
	console.log(`Someone invited me: @${inviter.username}`);

	// 承認
	const game = await request.post(`${apiUrl}/games/reversi/match`, {
		json: {
			i: config.i,
			userId: inviter.id
		}
	});

	gameStart(game);
}
