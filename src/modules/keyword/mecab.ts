import { spawn } from 'child_process';
import * as util from 'util';
import * as stream from 'stream';
import * as memoryStreams from 'memory-streams';
import { EOL } from 'os';

const pipeline = util.promisify(stream.pipeline);

/**
 * Run MeCab
 * @param text Text to analyze
 * @param mecab mecab bin
 * @param dic mecab dictionaly path
 */
export async function mecab(text: string, mecab = 'mecab', dic?: string): Promise<string[][]> {
	const args: string[] = [];
	if (dic) args.push('-d', dic);

	const lines = await cmd(mecab, args, `${text.replace(/[\n\s\t]/g, ' ')}\n`);

	const results: string[][] = [];

	for (const line of lines) {
		if (line === 'EOS') break;
		const [word, value = ''] = line.split('\t');
		const array = value.split(',');
		array.unshift(word);
		results.push(array);
	}

	return results;
}

export async function cmd(command: string, args: string[], stdin: string): Promise<string[]> {
	const mecab = spawn(command, args);

	const writable = new memoryStreams.WritableStream();

	mecab.stdin.write(stdin);
	mecab.stdin.end();

	await pipeline(mecab.stdout, writable);

	return writable.toString().split(EOL);
}
