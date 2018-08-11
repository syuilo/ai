import 藍 from './ai';
import config from './config';
import ReversiModule from './modules/reversi';
import ServerModule from './modules/server';
import PingModule from './modules/ping';
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
	ai.install(new ServerModule());
	ai.install(new ReversiModule());
});
