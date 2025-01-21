import { bindThis } from '@/decorators.js';
import { parse } from 'twemoji-parser';

import type { Note } from '@/misskey/note.js';
import Module from '@/module.js';
import Stream from '@/stream.js';
import includes from '@/utils/includes.js';
import { sleep } from '@/utils/sleep.js';

export default class extends Module {
	public readonly name = 'emoji-react';

	private htl: ReturnType<Stream['useSharedConnection']>;

	@bindThis
	public install() {
		this.htl = this.ai.connection.useSharedConnection('homeTimeline');
		this.htl.on('note', this.onNote);

		return {};
	}

	@bindThis
	private async onNote(note: Note) {
		if (note.reply != null) return;
		if (note.text == null) return;
		if (note.text.includes('@')) return; // Reject if it looks like a mention (whether of yourself or someone else)

		const react = async (reaction: string, immediate = false) => {
			if (!immediate) {
				await sleep(1500);
			}
			this.ai.api('notes/reactions/create', {
				noteId: note.id,
				reaction: reaction
			});
		};

		const customEmojis = note.text.match(/:([^\n:]+?):/g);
		if (customEmojis) {
			// Cancel if there are multiple custom emojis
			if (!customEmojis.every((val, i, arr) => val === arr[0])) return;

			this.log(`Custom emoji detected - ${customEmojis[0]}`);

			return react(customEmojis[0]);
		}

		const emojis = parse(note.text).map(x => x.text);
		if (emojis.length > 0) {
			// Cancel if there are multiple emojis
			if (!emojis.every((val, i, arr) => val === arr[0])) return;

			this.log(`Emoji detected - ${emojis[0]}`);

			let reaction = emojis[0];

			switch (reaction) {
				case '✊': return react('🖐', true);
				case '✌': return react('✊', true);
				case '🖐': case '✋': return react('✌', true);
			}

			return react(reaction);
		}

		if (includes(note.text, ['pizza'])) return react('🍕');
		if (includes(note.text, ['Pudding'])) return react('🍮');
		if (includes(note.text, ['Penis','bulging','dick','wang','peepee'])) return react('🍆');
		if (includes(note.text, ['booty','ass','butt','twerk'])) return react('🍑');
		if (includes(note.text, ['vagene','taco'])) return react('🌮');
		if (includes(note.text, ['bobs','booba','boobs','cherry','tatas'])) return react('🍒');
		if (includes(note.text, ['nuts','balls','sack'])) return react('🥜🥜');
		if (includes(note.text, ['sushi', 'sushi']) || note.text === 'Sushi') return react('🍣');

		if (includes(note.text, ['Indigo'])) return react('🙌');
	}
}
