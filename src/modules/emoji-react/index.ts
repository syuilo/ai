import autobind from 'autobind-decorator';
const emojiRegex = require('emoji-regex');

import { Note } from '../../misskey/note';
import Module from '../../module';
import Stream from '../../stream';
import includes from '../../utils/includes';

export default class extends Module {
	public readonly name = 'emoji-react';

	private htl: ReturnType<Stream['useSharedConnection']>;

	@autobind
	public install() {
		this.htl = this.ai.connection.useSharedConnection('homeTimeline');
		this.htl.on('note', this.onNote);

		return {};
	}

	@autobind
	private async onNote(note: Note) {
		if (note.reply != null) return;
		if (note.text == null) return;
		if (note.text.includes('@')) return; // (自分または他人問わず)メンションっぽかったらreject

		const react = (reaction: string) => {
			setTimeout(() => {
				this.ai.api('notes/reactions/create', {
					noteId: note.id,
					reaction: reaction
				});
			}, 2000);
		};

		const customEmojis = note.text.match(/:([^\n:]+?):/g);
		if (customEmojis) {
			// カスタム絵文字が複数種類ある場合はキャンセル
			if (!customEmojis.every((val, i, arr) => val === arr[0])) return;

			this.log(`Custom emoji detected - ${customEmojis[0]}`);

			return react(customEmojis[0]);
		}

		const emojis = note.text.match(emojiRegex());
		if (emojis) {
			// 絵文字が複数種類ある場合はキャンセル
			if (!emojis.every((val, i, arr) => val === arr[0])) return;

			this.log(`Emoji detected - ${emojis[0]}`);

			let reaction = emojis[0];

			switch (reaction) {
				case '✊': reaction = '🖐'; break;
				case '✌': reaction = '✊'; break;
				case '🖐': reaction = '✌'; break;
			}

			return react(reaction);
		}

		if (includes(note.text, ['ぴざ'])) return react('🍕');
		if (includes(note.text, ['ぷりん'])) return react('🍮');
		if (includes(note.text, ['寿司', 'sushi']) || note.text === 'すし') return react('🍣');
	}
}
