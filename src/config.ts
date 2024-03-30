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

import chalk from 'chalk';
import uncheckedConfig from '../config.json' assert { type: 'json' };
import { warn } from '@/utils/log.js';

function warnWithPrefix(msg: string): void {
	warn(`[Config]: ${chalk.red(msg)}`);
}

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

class OptionalProperty<K extends keyof Config> {
	protected readonly key: K;
	protected readonly type: Type<Config[K]>

	public constructor(key: K, type: Type<Config[K]>) {
		this.key = key;
		this.type = type;
	}

	check(config: Object): config is { [J in K]?: Config[K] } {
		const key = this.key;
		if (!(key in config)) {
			return true;
		}
		const result = this.type.check((config as { [J in K]?: unknown})[key]);
		if (!result) {
			warnWithPrefix(`config.json: The type of property '${key}' must be ${this.type.name}`);
		}
		return result;
	}
}

class Property<K extends keyof Config> extends OptionalProperty<K> {
	check(config: Object): config is { [J in K]: Config[K] } {
		const result = this.key in config && this.type.check((config as { [J in K]?: unknown })[this.key]);
		if (!result) {
			warnWithPrefix(`config.json: Property '${this.key}': ${this.type.name} required`);
		}
		return result;
	}
}

type Intersection<P extends unknown[]> = P extends [infer Q, ...infer R] ? Q & Intersection<R> : unknown;

function checkProperties<P extends OptionalProperty<keyof Config>[]>(config: Object, ...properties: P):
		config is object & Intersection<{ [I in keyof P]: P[I] extends OptionalProperty<infer K> ? { [J in K]: Config[K] } : never }> {
	// メッセージを表示するためすべてのプロパティをチェックしてから結果を返す
	return properties.map(p => p.check(config)).every(c => c);
}

function setProperty<K extends keyof Config>(config: Object, key: K, value: Config[K]): asserts config is { [L in K]: Config[K] } {
	(config as { [L in K]?: Config[K] })[key] = value;
}

function validate(config: unknown): Config {
	if (!(config instanceof Object)) {
		warnWithPrefix('config.json: Root object required');
	} else if (
		checkProperties(
			config,
			new Property('host', Type.string),
			new OptionalProperty('serverName', Type.string),
			new Property('i', Type.string),
			new OptionalProperty('master', Type.string),
			new Property('keywordEnabled', Type.boolean),
			new Property('reversiEnabled', Type.boolean),
			new Property('notingEnabled', Type.boolean),
			new Property('chartEnabled', Type.boolean),
			new Property('serverMonitoring', Type.boolean),
			new OptionalProperty('checkEmojisEnabled', Type.boolean),
			new OptionalProperty('checkEmojisAtOnce', Type.boolean),
			new OptionalProperty('mecab', Type.string),
			new OptionalProperty('mecabDic', Type.string),
			new OptionalProperty('memoryDir', Type.string)
		)
	) {
		setProperty(config, 'wsUrl', config.host.replace('http', 'ws'));
		setProperty(config, 'apiUrl', config.host + '/api');
		return config;
	}
	throw new TypeError('config.json has an invalid type');
}

const config = validate(uncheckedConfig);

export default config;
