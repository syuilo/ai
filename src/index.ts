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
	log(`Account fetching... (${config.host})`);
	return request.post(`${config.apiUrl}/i`, {
		json: {
			i: config.i
		}
	}).catch(retry);
}, {
	retries: 3
}).then(account => {
	log(chalk.green(`Account fetched successfully: @${account.username}`));

	log('Starting AiOS...');

	const ai = new 藍(account, run => {
		new EmojiModule(ai);
		new FortuneModule(ai);
		new GuessingGameModule(ai);
		new ReversiModule(ai);
		new TimerModule(ai);
		new DiceModule(ai);
		new CoreModule(ai);
		new PingModule(ai);
		new WelcomeModule(ai);
		new ServerModule(ai);
		new FollowModule(ai);
		new BirthdayModule(ai);
		new ValentineModule(ai);
		if (config.keywordEnabled) new KeywordModule(ai);

		run();
	});
}).catch(e => {
	log(chalk.red('Failed to fetch the account'));
});
