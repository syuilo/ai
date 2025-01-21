import { bindThis } from '@/decorators.js';
import Module from '@/module.js';
import Message from '@/message.js';
import serifs from '@/serifs.js';
import seedrandom from 'seedrandom';
import { genItem } from '@/vocabulary.js';

export const blessing = [
	'mysterious child',
	'alright',
	'good',
	'okay',
	'pretty lucky',
	'best in the world,
	'approx. Sept. 8',
	'succubus',
	'slight luck',
	'financial luck',
	'big luck',
	'Desi Fortuna',
	'centipedent',
	'Not yet',
	'Nanokichi',
	'PicoKichi',
	'Good Luck',
	'Auspicious',
	'Lucky #7',
	'night of the 14th day of the eight month of the lunar calendar',
	'very good luck',
	'mucho lucko',
	'excellent luck',
	'good luck',
	'15th day of the second month of the lunar calendar (around mid-spring)',
	'slightly good luck ',
	'unlucky',
	'Very bad luck',
];

export default class extends Module {
	public readonly name = 'fortune';

	@bindThis
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@bindThis
	private async mentionHook(msg: Message) {
		if (msg.includes(['Fortune telling', 'うらな', 'fortune', 'おみくじ'])) {
			const date = new Date();
			const seed = `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}@${msg.userId}`;
			const rng = seedrandom(seed);
			const omikuji = blessing[Math.floor(rng() * blessing.length)];
			const item = genItem(rng);
			msg.reply('$[fg.red ' + `**${omikuji}🎉**\nラッキーアイテム: ${item} + ']' `, {
				cw: serifs.fortune.cw(msg.friend.name)
			});
			return true;
		} else {
			return false;
		}
	}
}
