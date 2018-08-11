type Config = {
	host: string;
	i: string;
	id: string;
	wsUrl: string;
	apiUrl: string;
	reversiEnabled: boolean;
};

const config = require('../config.json');

config.wsUrl = config.host.replace('http', 'ws');
config.apiUrl = config.host + '/api';

export default config as Config;
