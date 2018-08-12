import 藍 from './ai';
const delay = require('timeout-as-promise');

export default class MessageLike {
	private ai: 藍;
	private messageOrNote: any;
	public isMessage: boolean;

	public get id() {
		return this.messageOrNote.id;
	}

	public get user() {
		return this.messageOrNote.user;
	}

	public get userId() {
		return this.messageOrNote.userId;
	}

	public get text() {
		return this.messageOrNote.text;
	}

	public get replyId() {
		return this.messageOrNote.replyId;
	}

	constructor(ai: 藍, messageOrNote: any, isMessage: boolean) {
		this.ai = ai;
		this.messageOrNote = messageOrNote;
		this.isMessage = isMessage;
	}

	public reply = async (text: string, cw?: string) => {
		console.log(`sending reply of ${this.id} ...`);

		await delay(2000);

		if (this.isMessage) {
			return await this.ai.sendMessage(this.messageOrNote.userId, {
				text: text
			});
		} else {
			return await this.ai.post({
				replyId: this.messageOrNote.id,
				text: text,
				cw: cw
			});
		}
	}
}
