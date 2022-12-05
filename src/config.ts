type Config = {
	host: string;
	i: string;
	master?: string;
	masterID?: string;
	wsUrl: string;
	apiUrl: string;
	keywordEnabled: boolean;
	reversiEnabled: boolean;
	notingEnabled: boolean;
	chartEnabled: boolean;
	serverMonitoring: boolean;
	mecab?: string;
	mecabDic?: string;
	memoryDir?: string;
	earthQuakeMonitorPort?: number;
	openAiApiKey?: string;
};

const config = require('../config.json');

config.wsUrl = config.host.replace('http', 'ws');
config.apiUrl = config.host + '/api';

export default config as Config;
