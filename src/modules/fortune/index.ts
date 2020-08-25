import autobind from 'autobind-decorator';
import Module from '../../module';
import Message from '../../message';
import serifs from '../../serifs';
import * as seedrandom from 'seedrandom';
import { blessing, itemPrefixes, items, and } from '../../vocabulary';

export default class extends Module {
	public readonly name = 'fortune';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (msg.includes(['占', 'うらな', '運勢', 'おみくじ'])) {
			const date = new Date();
			const seed = `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}@${msg.userId}`;
			const rng = seedrandom(seed);
			const omikuji = blessing[Math.floor(rng() * blessing.length)];
			let item = '';
			if (Math.floor(rng() * 5) !== 0) item += itemPrefixes[Math.floor(rng() * itemPrefixes.length)];
			item += items[Math.floor(rng() * items.length)];
			if (Math.floor(rng() * 3) === 0) {
				item += and[Math.floor(rng() * and.length)];
				if (Math.floor(rng() * 5) !== 0) item += itemPrefixes[Math.floor(rng() * itemPrefixes.length)];
				item += items[Math.floor(rng() * items.length)];
			}
			msg.reply(`**${omikuji}🎉**\nラッキーアイテム: ${item}`, serifs.fortune.cw(msg.friend.name));
			return true;
		} else {
			return false;
		}
	}
}
