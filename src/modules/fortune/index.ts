import autobind from 'autobind-decorator';
import Module from '../../module';
import MessageLike from '../../message-like';
import serifs from '../../serifs';
import * as seedrandom from 'seedrandom';
import { blessing, itemPrefixes, items } from './vocabulary';

export default class FortuneModule extends Module {
	public readonly name = 'fortune';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
	private mentionHook(msg: MessageLike) {
		if (msg.includes(['占', 'うらな', '運勢', 'おみくじ'])) {
			const date = new Date();
			const seed = `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}@${msg.userId}`;
			const rng = seedrandom(seed);
			const omikuji = blessing[Math.floor(rng() * blessing.length)];
			const itemPrefix = Math.floor(rng() * 5) != 0 ? itemPrefixes[Math.floor(rng() * itemPrefixes.length)] : '';
			const item = items[Math.floor(rng() * items.length)];
			msg.reply(`**${omikuji}🎉**\nラッキーアイテム: ${itemPrefix}${item}`, serifs.fortune.cw(msg.friend.name));
			return true;
		} else {
			return false;
		}
	}
}
