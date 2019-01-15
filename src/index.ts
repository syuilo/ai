import 藍 from './ai';
import config from './config';
import _log from './utils/log';

import CoreModule from './modules/core';
import BirthdayModule from './modules/birthday';
import ReversiModule from './modules/reversi';
import PingModule from './modules/ping';
import EmojiModule from './modules/emoji';
import FortuneModule from './modules/fortune';
import GuessingGameModule from './modules/guessing-game';
import KeywordModule from './modules/keyword';
import WelcomeModule from './modules/welcome';
import TimerModule from './modules/timer';
import DiceModule from './modules/dice';
import ServerModule from './modules/server';
import FollowModule from './modules/follow';
import ValentineModule from './modules/valentine';

import chalk from 'chalk';
import * as request from 'request-promise-native';
const promiseRetry = require('promise-retry');

function log(msg: string): void {
	_log(`[Boot]: ${msg}`);
}

log(chalk.bold('Ai v1.0'));

promiseRetry(retry => {
	log(`Account fetching... ${chalk.gray(config.host)}`);
	return request.post(`${config.apiUrl}/i`, {
		json: {
			i: config.i
		}
	}).catch(retry);
}, {
	retries: 3
}).then(account => {
	const acct = `@${account.username}`;
	log(chalk.green(`Account fetched successfully: ${chalk.underline(acct)}`));

	log('Starting AiOS...');

	new 藍(account, [
		new EmojiModule(),
		new FortuneModule(),
		new GuessingGameModule(),
		new ReversiModule(),
		new TimerModule(),
		new DiceModule(),
		new CoreModule(),
		new PingModule(),
		new WelcomeModule(),
		new ServerModule(),
		new FollowModule(),
		new BirthdayModule(),
		new ValentineModule(),
		new KeywordModule(),
	]);
}).catch(e => {
	log(chalk.red('Failed to fetch the account'));
});
