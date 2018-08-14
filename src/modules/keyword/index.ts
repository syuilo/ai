import 藍 from '../../ai';
import IModule from '../../module';
import config from '../../config';
import MessageLike from '../../message-like';
import serifs from '../../serifs';
const MeCab = require('mecab-async');

function kanaToHira(str: string) {
	return str.replace(/[\u30a1-\u30f6]/g, match => {
		const chr = match.charCodeAt(0) - 0x60;
		return String.fromCharCode(chr);
	});
}

export default class KeywordModule implements IModule {
	public name = 'keyword';

	private ai: 藍;
	private tokenizer: any;

	public install = (ai: 藍) => {
		this.ai = ai;

		this.tokenizer = new MeCab();
		this.tokenizer.command = config.mecab;

		setInterval(this.say, 1000 * 60 * 60);
	}

	private say = async (msg?: MessageLike) => {
		const tl = await this.ai.api('notes/local-timeline', {
			limit: 30
		});

		const interestedNotes = tl.filter(note => note.userId !== this.ai.account.id && note.text != null);

		let keywords: string[][] = [];

		await Promise.all(interestedNotes.map(note => new Promise((res, rej) => {
			this.tokenizer.parse(note.text, (err, tokens) => {
				const keywordsInThisNote = tokens.filter(token => token[2] == '固有名詞' && token[8] != null);
				keywords = keywords.concat(keywordsInThisNote);
				res();
			});
		})));

		console.log(keywords);

		const rnd = Math.floor((1 - Math.sqrt(Math.random())) * keywords.length);
		const keyword = keywords.sort((a, b) => a[0].length < b[0].length ? 1 : -1)[rnd];

		const text = serifs.KEYWORD
			.replace('{word}', keyword[0])
			.replace('{reading}', kanaToHira(keyword[8]))

		if (msg) {
			msg.reply(text);
		} else {
			this.ai.post({
				text: text
			});
		}
	}

	public onMention = (msg: MessageLike) => {
		if (msg.user.isAdmin && msg.isMessage && msg.text && msg.text.includes('なんか皆に言って')) {
			this.say();
			return true;
		} else if (msg.text && msg.text.includes('なんか言って')) {
			this.say(msg);
			return true;
		} else {
			return false;
		}
	}
}
