import 藍 from './ai';

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

	constructor(ai: 藍, messageOrNote: any, isMessage: boolean) {
		this.ai = ai;
		this.messageOrNote = messageOrNote;
		this.isMessage = isMessage;
	}

	public reply = (text: string, cw?: string) => {
		console.log(`sending reply of ${this.id} ...`);

		setTimeout(() => {
			if (this.isMessage) {
				this.ai.sendMessage(this.messageOrNote.userId, {
					text: text
				});
			} else {
				this.ai.post({
					replyId: this.messageOrNote.id,
					text: text,
					cw: cw
				});
			}
		}, 2000);
	}
}
