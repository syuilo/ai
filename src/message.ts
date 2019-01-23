import autobind from 'autobind-decorator';
import 藍 from './ai';
import Friend from './friend';
import { User } from './misskey/user';
import includes from './utils/includes';
import or from './utils/or';
import chalk from 'chalk';
const delay = require('timeout-as-promise');

export default class Message {
	private ai: 藍;
	private messageOrNote: any;
	public isDm: boolean;

	public get id(): string {
		return this.messageOrNote.id;
	}

	public get user(): User {
		return this.messageOrNote.user;
	}

	public get userId(): string {
		return this.messageOrNote.userId;
	}

	public get text(): string {
		return this.messageOrNote.text;
	}

	public get replyId(): string {
		return this.messageOrNote.replyId;
	}

	public friend: Friend;

	constructor(ai: 藍, messageOrNote: any, isDm: boolean) {
		this.ai = ai;
		this.messageOrNote = messageOrNote;
		this.isDm = isDm;

		this.friend = new Friend(ai, { user: this.user });

		// メッセージなどに付いているユーザー情報は省略されている場合があるので完全なユーザー情報を持ってくる
		this.ai.api('users/show', {
			userId: this.userId
		}).then(user => {
			this.friend.updateUser(user);
		});
	}

	@autobind
	public async reply(text: string, cw?: string, renote?: string) {
		if (text == null) return;

		this.ai.log(`>>> Sending reply to ${chalk.underline(this.id)}`);

		await delay(2000);

		if (this.isDm) {
			return await this.ai.sendMessage(this.messageOrNote.userId, {
				text: text
			});
		} else {
			return await this.ai.post({
				replyId: this.messageOrNote.id,
				text: text,
				cw: cw,
				renoteId: renote
			});
		}
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
