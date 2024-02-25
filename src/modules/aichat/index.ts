import { bindThis } from '@/decorators.js';
import Module from '@/module.js';
import serifs from '@/serifs.js';
import Message from '@/message.js';
import config from '@/config.js';
import got from 'got';

type AiChat = {
	question: string;
	prompt: string;
	api: string;
	key: string;
};
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export default class extends Module {
	public readonly name = 'aichat';

	@bindThis
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@bindThis
	private async genTextByGemini(aiChat: AiChat) {
		this.log('Generate Text By Gemini...');
		var options = {
			url: aiChat.api,
			searchParams: {
				key: aiChat.key,
			},
			json: {
				contents: [{
					parts:[{
						text: aiChat.prompt + aiChat.question
					}]
				}]
			},
		};
		let res_data:any = null;
		try {
			res_data = await got.post(options,
				{parseJson: res => JSON.parse(res)}).json();
			this.log(JSON.stringify(res_data));
			if (res_data.hasOwnProperty('candidates')) {
				if (res_data.candidates.length > 0) {
					if (res_data.candidates[0].hasOwnProperty('content')) {
						if (res_data.candidates[0].content.hasOwnProperty('parts')) {
							if (res_data.candidates[0].content.parts.length > 0) {
								if (res_data.candidates[0].content.parts[0].hasOwnProperty('text')) {
									return res_data.candidates[0].content.parts[0].text;
								}
							}
						}
					}
				}
			}
		} catch (err: unknown) {
			this.log('Error By Call Gemini');
			if (err instanceof Error) {
				this.log(`${err.name}\n${err.message}`);
			}
		}
		return null;
	}

	@bindThis
	private async mentionHook(msg: Message) {
		if (!msg.includes([this.name])) {
			return false;
		} else {
			this.log('AiChat requested');
		}

		const kigo = '&';
		let type = 'gemini';
		if (msg.includes([kigo + 'gemini'])) {
			type = 'gemini';
		} else if (msg.includes([kigo + 'chatgpt4'])) {
			type = 'chatgpt4';
		} else if (msg.includes([kigo + 'chatgpt'])) {
			type = 'chatgpt3.5';
		}
		const question = msg.extractedText
							.replace(this.name, '')
							.replace(kigo + type, '')
							.trim();

		let text;
		let prompt = '';
		if (config.prompt) {
			prompt = config.prompt;
		}
		switch(type) {
			case 'gemini':
				if (!config.geminiProApiKey) {
					msg.reply(serifs.aichat.nothing(type));
					return false;
				}
				const aiChat = {
					question: question,
					prompt: prompt,
					api: GEMINI_API,
					key: config.geminiProApiKey
				};
				text = await this.genTextByGemini(aiChat);
				break;
			default:
				msg.reply(serifs.aichat.nothing(type));
				return false;
		}

		if (text == null) {
			this.log('The result is invalid. It seems that tokens and other items need to be reviewed.')
			msg.reply(serifs.aichat.nothing(type));
			return false;
		}

		this.log('Replying...');
		msg.reply(serifs.aichat.post(text, type));

		return {
			reaction: 'like'
		};
	}
}
