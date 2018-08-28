import 藍 from './ai';
import config from './config';

import CoreModule from './modules/core';
import ReversiModule from './modules/reversi';
import PingModule from './modules/ping';
import EmojiModule from './modules/emoji';
import FortuneModule from './modules/fortune';
import GuessingGameModule from './modules/guessing-game';
import KeywordModule from './modules/keyword';
import WelcomeModule from './modules/welcome';
import TimerModule from './modules/timer';

import * as request from 'request-promise-native';
import IModule from './module';
const promiseRetry = require('promise-retry');

console.log('--- starting ai... ---');

promiseRetry(retry => {
	return request.post(`${config.apiUrl}/i`, {
		json: {
			i: config.i
		}
	}).catch(retry);
}).then(account => {
	console.log(`account fetched: @${account.username}`);

	const modules: IModule[] = [
		new CoreModule(),
		new PingModule(),
		new WelcomeModule(),
		new EmojiModule(),
		new FortuneModule(),
		new GuessingGameModule(),
		new ReversiModule(),
		new TimerModule()
	];

	if (config.keywordEnabled) modules.push(new KeywordModule());

	new 藍(account, modules);

	console.log('--- ai started! ---');
});
