import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';
import serifs from '@/serifs';

const hands = [
	'👏',
	'👍',
	'👎',
	'👊',
	'✊',
	['🤛', '🤜'],
	['🤜', '🤛'],
	'🤞',
	'✌',
	'🤟',
	'🤘',
	'👌',
	'👈',
	'👉',
	['👈', '👉'],
	['👉', '👈'],
	'👆',
	'👇',
	'☝',
	['✋', '🤚'],
	'🖐',
	'🖖',
	'👋',
	'🤙',
	'💪',
	['💪', '✌'],
	'🖕'
]

const faces = [
	'😀',
	'😃',
	'😄',
	'😁',
	'😆',
	'😅',
	'😂',
	'🤣',
	'☺️',
	'😊',
	'😇',
	'🙂',
	'🙃',
	'😉',
	'😌',
	'😍',
	'🥰',
	'😘',
	'😗',
	'😙',
	'😚',
	'😋',
	'😛',
	'😝',
	'😜',
	'🤪',
	'🤨',
	'🧐',
	'🤓',
	'😎',
	'🤩',
	'🥳',
	'😏',
	'😒',
	'😞',
	'😔',
	'😟',
	'😕',
	'🙁',
	'☹️',
	'😣',
	'😖',
	'😫',
	'😩',
	'🥺',
	'😢',
	'😭',
	'😤',
	'😠',
	'😡',
	'🤬',
	'🤯',
	'😳',
	'😱',
	'😨',
	'😰',
	'😥',
	'😓',
	'🤗',
	'🤔',
	'🤭',
	'🤫',
	'🤥',
	'😶',
	'😐',
	'😑',
	'😬',
	'🙄',
	'😯',
	'😦',
	'😧',
	'😮',
	'😲',
	'😴',
	'🤤',
	'😪',
	'😵',
	'🤐',
	'🥴',
	'🤢',
	'🤮',
	'🤧',
	'😷',
	'🤒',
	'🤕',
	'🤑',
	'🤠',
	'🗿',
	'🤖',
	'👽'
]

export default class extends Module {
	public readonly name = 'emoji';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (msg.includes(['顔文字', '絵文字', 'emoji', '福笑い'])) {
			const hand = hands[Math.floor(Math.random() * hands.length)];
			const face = faces[Math.floor(Math.random() * faces.length)];
			const emoji = Array.isArray(hand) ? hand[0] + face + hand[1] : hand + face + hand;
			msg.reply(serifs.emoji.suggest(emoji));
			return true;
		} else {
			return false;
		}
	}
}
