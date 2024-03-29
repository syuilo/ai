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
import log from '@/utils/log.js';

class Type<T> {
	public static readonly string = new Type<string>('string');
	public static readonly boolean = new Type<boolean>('boolean');

	public readonly name: string;

	private constructor(name: string) {
		this.name = name;
	}

	check(value: unknown): value is T {
		return typeof value == this.name;
	}
}

function checkProperty<K extends keyof Config>(config: Object, key: K, type: Type<Config[K]>): config is { [J in K]: Config[K] } {
	const result = key in config && type.check(config[key as string]);
	if (!result) {
		log(`config.json: Property ${key}: ${type.name} required`);
	}
	return result;
}

function checkOptionalProperty<K extends keyof Config>(config: Object, key: K, type: Type<Config[K]>): config is { [J in K]?: Config[K] } {
	if (!(key in config)) {
		return true;
	}
	const result = type.check(config[key as string]);
	if (!result) {
		log(`config.json: The type of property ${key} must be ${type.name}`);
	}
	return result;
}

function setProperty<K extends keyof Config>(config: Object, key: K, value: Config[K]): asserts config is { [L in K]: Config[K] } {
	(config as { [L in K]?: Config[K] })[key] = value;
}

function validate(config: unknown): Config {
	if (!(config instanceof Object)) {
		log('config.json: Root object required');
	} else if (
		checkProperty(config, 'host', Type.string) &&
		checkOptionalProperty(config, 'serverName', Type.string) &&
		checkProperty(config, 'i', Type.string) &&
		checkOptionalProperty(config, 'master', Type.string) &&
		checkProperty(config, 'keywordEnabled', Type.boolean) &&
		checkProperty(config, 'reversiEnabled', Type.boolean) &&
		checkProperty(config, 'notingEnabled', Type.boolean) &&
		checkProperty(config, 'chartEnabled', Type.boolean) &&
		checkProperty(config, 'serverMonitoring', Type.boolean) &&
		checkOptionalProperty(config, 'checkEmojisEnabled', Type.boolean) &&
		checkOptionalProperty(config, 'checkEmojisAtOnce', Type.boolean) &&
		checkOptionalProperty(config, 'mecab', Type.string) &&
		checkOptionalProperty(config, 'mecabDic', Type.string) &&
		checkOptionalProperty(config, 'memoryDir', Type.string)
	) {
		setProperty(config, 'wsUrl', config.host.replace('http', 'ws'));
		setProperty(config, 'apiUrl', config.host + '/api');
		return config;
	}
	throw new TypeError('config.json has an invalid type');
}

const config = validate(uncheckedConfig);

export default config;
