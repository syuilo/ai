type Config = {
	host: string;
	serverName?: string;
	i: string;
	master?: string;
	wsUrl: string;
	apiUrl: string;
	keywordEnabled: boolean;
	reversiEnabled: boolean;
	notingEnabled: boolean;
	chartEnabled: boolean;
	serverMonitoring: boolean;
	checkEmojisEnabled?: boolean;
	checkEmojisAtOnce?: boolean;
	mecab?: string;
	mecabDic?: string;
	memoryDir?: string;
};

import uncheckedConfig from '../config.json' assert { type: 'json' };

function validate(config: unknown): Config {
	// TODO: as を使わずにしっかりと検証を行う
	return config as Config;
}

const config = validate(uncheckedConfig);

config.wsUrl = config.host.replace('http', 'ws');
config.apiUrl = config.host + '/api';

export default config;
