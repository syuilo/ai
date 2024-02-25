// AiOS bootstrapper

import process from 'node:process';
import chalk from 'chalk';
import got from 'got';
import promiseRetry from 'promise-retry';

import 藍 from './ai.js';
import config from './config.js';
import _log from './utils/log.js';
import pkg from '../package.json' assert { type: 'json' };

import CoreModule from './modules/core/index.js';
import TalkModule from './modules/talk/index.js';
import BirthdayModule from './modules/birthday/index.js';
import ReversiModule from './modules/reversi/index.js';
import PingModule from './modules/ping/index.js';
import EmojiModule from './modules/emoji/index.js';
import EmojiReactModule from './modules/emoji-react/index.js';
import FortuneModule from './modules/fortune/index.js';
import GuessingGameModule from './modules/guessing-game/index.js';
import KazutoriModule from './modules/kazutori/index.js';
import KeywordModule from './modules/keyword/index.js';
import WelcomeModule from './modules/welcome/index.js';
import TimerModule from './modules/timer/index.js';
import DiceModule from './modules/dice/index.js';
import ServerModule from './modules/server/index.js';
import FollowModule from './modules/follow/index.js';
import ValentineModule from './modules/valentine/index.js';
import MazeModule from './modules/maze/index.js';
import ChartModule from './modules/chart/index.js';
import SleepReportModule from './modules/sleep-report/index.js';
import NotingModule from './modules/noting/index.js';
import PollModule from './modules/poll/index.js';
import ReminderModule from './modules/reminder/index.js';
import CheckCustomEmojisModule from './modules/check-custom-emojis/index.js';

console.log('   __    ____  _____  ___ ');
console.log('  /__\\  (_  _)(  _  )/ __)');
console.log(' /(__)\\  _)(_  )(_)( \\__ \\');
console.log('(__)(__)(____)(_____)(___/\n');

function log(msg: string): void {
	_log(`[Boot]: ${msg}`);
}

log(chalk.bold(`Ai v${pkg._v}`));

process.on('uncaughtException', err => {
	try {
		console.error(`Uncaught exception: ${err.message}`);
		console.dir(err, { colors: true, depth: 2 });
	} catch { }
});

promiseRetry(retry => {
	log(`Account fetching... ${chalk.gray(config.host)}`);

	// アカウントをフェッチ
	return got.post(`${config.apiUrl}/i`, {
		json: {
			i: config.i
		}
	}).json().catch(retry);
}, {
	retries: 3
}).then(account => {
	const acct = `@${account.username}`;
	log(chalk.green(`Account fetched successfully: ${chalk.underline(acct)}`));

	log('Starting AiOS...');

	// 藍起動
	new 藍(account, [
		new CoreModule(),
		new EmojiModule(),
		new EmojiReactModule(),
		new FortuneModule(),
		new GuessingGameModule(),
		new KazutoriModule(),
		new ReversiModule(),
		new TimerModule(),
		new DiceModule(),
		new TalkModule(),
		new PingModule(),
		new WelcomeModule(),
		new ServerModule(),
		new FollowModule(),
		new BirthdayModule(),
		new ValentineModule(),
		new KeywordModule(),
		new MazeModule(),
		new ChartModule(),
		new SleepReportModule(),
		new NotingModule(),
		new PollModule(),
		new ReminderModule(),
		new CheckCustomEmojisModule(),
	]);
}).catch(e => {
	log(chalk.red('Failed to fetch the account'));
});
