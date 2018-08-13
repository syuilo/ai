import 藍 from './ai';
import config from './config';
import ReversiModule from './modules/reversi';
import ServerModule from './modules/server';
import PingModule from './modules/ping';
import EmojiModule from './modules/emoji';
import FortuneModule from './modules/fortune';
import GuessingGameModule from './modules/guessing-game';
import KeywordModule from './modules/keyword';
import WelcomeModule from './modules/welcome';
import * as request from 'request-promise-native';
const promiseRetry = require('promise-retry');

promiseRetry(retry => {
	return request.post(`${config.apiUrl}/i`, {
		json: {
			i: config.i
		}
	}).catch(retry);
}).then(account => {
	const ai = new 藍(account);

	ai.install(new PingModule());
	ai.install(new WelcomeModule());
	ai.install(new EmojiModule());
	ai.install(new FortuneModule());
	ai.install(new GuessingGameModule());
	ai.install(new ServerModule());
	ai.install(new ReversiModule());
	if (config.keywordEnabled) ai.install(new KeywordModule());
});
