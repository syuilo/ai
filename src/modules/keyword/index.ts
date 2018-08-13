import 藍 from '../../ai';
import IModule from '../../module';
import config from '../../config';
import * as kuromoji from 'kuromoji';
import MessageLike from '../../message-like';
import serifs from '../../serifs';

export default class KeywordModule implements IModule {
	public name = 'keyword';

	private ai: 藍;
	private tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures>;

	public install = (ai: 藍) => {
		this.ai = ai;

		kuromoji.builder({
			dicPath: config.mecabDic
		}).build((err, tokenizer) => {
			if (err) {
				console.error(err);
			} else {
				this.tokenizer = tokenizer;

				setTimeout(this.say, 1000 * 60 * 60);
			}
		});
	}

	private say = async () => {
		const tl = await this.ai.api('notes/local-timeline');

		const interestedNotes = tl.filter(note => note.userId !== this.ai.account.id && note.text != null);

		let keywords: kuromoji.IpadicFeatures[] = [];

		interestedNotes.forEach(note => {
			const tokens = this.tokenizer.tokenize(note.text);
			const keywordsInThisNote = tokens.filter(token => token.pos_detail_1 == '固有名詞');
			keywords = keywords.concat(keywordsInThisNote);
		});

		console.log(keywords);

		const keyword = keywords[Math.floor(Math.random() * keywords.length)];

		this.ai.post(serifs.KEYWORD
			.replace('{word}', keyword.surface_form)
			.replace('{reading}', keyword.reading));
	}

	public onMention = (msg: MessageLike) => {
		if (msg.user.isAdmin && msg.text && msg.text.includes('なんか言って')) {
			this.say();
			return true;
		} else {
			return false;
		}
	}
}
