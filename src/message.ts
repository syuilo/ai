import autobind from 'autobind-decorator';
import * as chalk from 'chalk';
const delay = require('timeout-as-promise');

import 藍 from '@/ai';
import Friend from '@/friend';
import { User } from '@/misskey/user';
import includes from '@/utils/includes';
import or from '@/utils/or';
import config from '@/config';

export default class Message {
	private ai: 藍;
	private note: any;

	public get id(): string {
		return this.note.id;
	}

	public get user(): User {
		return this.note.user;
	}

	public get userId(): string {
		return this.note.userId;
	}

	public get text(): string {
		return this.note.text;
	}

	public get quoteId(): string | null {
		return this.note.renoteId;
	}

	public get visibility(): string {
		return this.note.visibility;
	}

	/**
	 * メンション部分を除いたテキスト本文
	 */
	public get extractedText(): string {
		const host = new URL(config.host).host.replace(/\./g, '\\.');
		return this.text
			.replace(new RegExp(`^@${this.ai.account.username}@${host}\\s`, 'i'), '')
			.replace(new RegExp(`^@${this.ai.account.username}\\s`, 'i'), '')
			.trim();
	}

	public get replyId(): string {
		return this.note.replyId;
	}

	public friend: Friend;

	constructor(ai: 藍, note: any) {
		this.ai = ai;
		this.note = note;

		this.friend = new Friend(ai, { user: this.user });

		// メッセージなどに付いているユーザー情報は省略されている場合があるので完全なユーザー情報を持ってくる
		this.ai.api('users/show', {
			userId: this.userId
		}).then(user => {
			this.friend.updateUser(user);
		});
	}

	@autobind
	public async reply(text: string | null, opts?: {
		file?: any;
		cw?: string;
		renote?: string;
		immediate?: boolean;
	}) {
		if (text == null) return;

		this.ai.log(`>>> Sending reply to ${chalk.underline(this.id)}`);

		if (!opts?.immediate) {
			await delay(2000);
		}

		return await this.ai.post({
			replyId: this.note.id,
			text: text,
			fileIds: opts?.file ? [opts?.file.id] : undefined,
			cw: opts?.cw,
			renoteId: opts?.renote
		});
	}

	@autobind
	public includes(words: string[]): boolean {
		return includes(this.text, words);
	}

	@autobind
	public or(words: (string | RegExp)[]): boolean {
		return or(this.text, words);
	}
}
