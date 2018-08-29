import 藍 from '../../ai';
import IModule from '../../module';
import MessageLike from '../../message-like';
import serifs from '../../serifs';
import * as seedrandom from 'seedrandom';

const omikujis = [
	'大大吉',
	'大吉',
	'吉',
	'中吉',
	'小吉',
	'凶',
	'大凶'
];

const items = [
	'ナス',
	'トマト',
	'きゅうり',
	'じゃがいも',
	'焼きビーフン',
	'腰',
	'寿司'
];

export default class FortuneModule implements IModule {
	public name = 'fortune';

	public install = (ai: 藍) => { }

	public onMention = (msg: MessageLike) => {
		if (msg.text == null) return false;

		if (msg.text.includes('占') || msg.text.includes('うらな') || msg.text.includes('運勢') || msg.text.includes('おみくじ')) {
			const date = new Date();
			const seed = `${date.getFullYear()}/${date.getMonth()}/${date.getDay()}@${msg.userId}`;
			const rng = seedrandom(seed);
			const omikuji = omikujis[Math.floor(rng() * omikujis.length)];
			const item = items[Math.floor(rng() * items.length)];
			msg.reply(`**${omikuji}🎉**\nラッキーアイテム: ${item}`, serifs.fortune.cw);
			return true;
		} else {
			return false;
		}
	}
}
