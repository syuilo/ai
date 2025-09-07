import { bindThis } from '@/decorators.js';
import Module from '@/module.js';
import serifs from '@/serifs.js';
import Message from '@/message.js';
import config from '@/config.js';
import Friend from '@/friend.js';
import urlToBase64 from '@/utils/url2base64.js';
import urlToJson from '@/utils/url2json.js';
import got from 'got';
import loki from 'lokijs';

type AiChat = {
	question: string;
	prompt: string;
	api: string;
	key: string;
	fromMention: boolean;
	friendName?: string;
	grounding?: boolean;
	history?: { role: string; content: string }[];
};

type base64File = {
	type: string;
	base64: string;
	url?: string;
};

type GeminiParts = {
	inlineData?: {
		mimeType: string;
		data: string;
	};
	fileData?: {
		mimeType: string;
		fileUri: string;
	};
	text?: string;
}[];

type GeminiSystemInstruction = {
	// Gemini v1beta: systemInstruction should be parts-only (no explicit role)
	parts: [{ text: string }];
};

type GeminiContents = {
	role: string;
	parts: GeminiParts;
};

type GeminiOptions = {
	contents?: GeminiContents[];
	systemInstruction?: GeminiSystemInstruction;
	tools?: any[]; // flexible across cookbook variants
};

type AiChatHist = {
	postId: string;
	createdAt: number;
	type: string;
	fromMention: boolean;
	api?: string;
	grounding?: boolean;
	history?: {
		role: string;
		content: string;
	}[];
};

type UrlPreview = {
	title: string;
	icon: string;
	description: string;
	thumbnail: string;
	player: {
		url: string;
		width: number;
		height: number;
		allow: [];
	};
	sitename: string;
	sensitive: boolean;
	activityPub: string;
	url: string;
};

const KIGO = '&';
const TYPE_GEMINI = 'gemini';
const GEMINI_PRO = 'gemini-pro';
const GEMINI_FLASH = 'gemini-flash';
const TYPE_PLAMO = 'plamo';
const GROUNDING_TARGET = 'ggg';

// Build endpoint from model name (config or inline override)
const makeGeminiApi = (model: string) =>
	`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const PLAMO_API = 'https://platform.preferredai.jp/api/completion/v1/chat/completions';

const RANDOMTALK_DEFAULT_PROBABILITY = 0.02;
const TIMEOUT_TIME = 1000 * 60 * 60 * 0.5;
const RANDOMTALK_DEFAULT_INTERVAL = 1000 * 60 * 60 * 12;

export default class extends Module {
	public readonly name = 'aichat';
	private aichatHist: loki.Collection<AiChatHist>;
	private randomTalkProbability: number = RANDOMTALK_DEFAULT_PROBABILITY;
	private randomTalkIntervalMinutes: number = RANDOMTALK_DEFAULT_INTERVAL;

	@bindThis
	public install() {
		this.aichatHist = this.ai.getCollection('aichatHist', {
			indices: ['postId']
		});

		if (
			config.aichatRandomTalkProbability != undefined &&
			!Number.isNaN(Number.parseFloat(config.aichatRandomTalkProbability))
		) {
			this.randomTalkProbability = Number.parseFloat(config.aichatRandomTalkProbability);
		}
		if (
			config.aichatRandomTalkIntervalMinutes != undefined &&
			!Number.isNaN(Number.parseInt(config.aichatRandomTalkIntervalMinutes))
		) {
			this.randomTalkIntervalMinutes = 1000 * 60 * Number.parseInt(config.aichatRandomTalkIntervalMinutes);
		}
		this.log('aichatRandomTalkEnabled:' + config.aichatRandomTalkEnabled);
		this.log('randomTalkProbability:' + this.randomTalkProbability);
		this.log('randomTalkIntervalMinutes:' + this.randomTalkIntervalMinutes / (60 * 1000));
		this.log('aichatGroundingWithGoogleSearchAlwaysEnabled:' + config.aichatGroundingWithGoogleSearchAlwaysEnabled);

		if (config.aichatRandomTalkEnabled) {
			setInterval(this.aichatRandomTalk, this.randomTalkIntervalMinutes);
		}

		return {
			mentionHook: this.mentionHook,
			contextHook: this.contextHook,
			timeoutCallback: this.timeoutCallback
		};
	}

	@bindThis
	private async genTextByGemini(aiChat: AiChat, files: base64File[]) {
		this.log('Generate Text By Gemini...');
		let parts: GeminiParts = [];
		const now = new Date().toLocaleString('ja-JP', {
			timeZone: 'Asia/Tokyo',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});

		// Build system instruction text
		let systemInstructionText =
			aiChat.prompt +
			'また、現在日時は' +
			now +
			'であり、これは回答の参考にし、時刻を聞かれるまで時刻情報は提供しないこと(なお、他の日時は無効とすること)。';

		if (aiChat.friendName != undefined) {
			systemInstructionText += 'なお、会話相手の名前は' + aiChat.friendName + 'とする。';
		}
		if (!aiChat.fromMention) {
			systemInstructionText +=
				'これらのメッセージは、あなたに対するメッセージではないことを留意し、返答すること(会話相手は突然話しかけられた認識している)。';
		}
		if (aiChat.grounding) {
			systemInstructionText += '返答のルール2:Google search with grounding.';
		}

		// Pull URL previews if any present in question
		if (aiChat.question !== undefined) {
			const urlexp = RegExp('(https?://[a-zA-Z0-9!?/+_~=:;.,*&@#$%\'-]+)', 'g');
			const urlarray = [...aiChat.question.matchAll(urlexp)];
			if (urlarray.length > 0) {
				for (const url of urlarray) {
					this.log('URL:' + url[0]);
					let result: unknown = null;
					try {
						result = await urlToJson(url[0]);
					} catch (_err: unknown) {
						systemInstructionText += '補足として提供されたURLは無効でした:URL=>' + url[0];
						this.log('Skip url because error in urlToJson');
						continue;
					}
					const urlpreview: UrlPreview = result as UrlPreview;
					if (urlpreview.title) {
						systemInstructionText +=
							'補足として提供されたURLの情報は次の通り:URL=>' +
							urlpreview.url +
							'サイト名(' +
							urlpreview.sitename +
							')、';
						if (!urlpreview.sensitive) {
							systemInstructionText +=
								'タイトル(' +
								urlpreview.title +
								')、' +
								'説明(' +
								urlpreview.description +
								')、' +
								'質問にあるURLとサイト名・タイトル・説明を組み合わせ、回答の参考にすること。';
							this.log('urlpreview.sitename:' + urlpreview.sitename);
							this.log('urlpreview.title:' + urlpreview.title);
							this.log('urlpreview.description:' + urlpreview.description);
						} else {
							systemInstructionText +=
								'これはセンシティブなURLの可能性があるため、質問にあるURLとサイト名のみで、回答の参考にすること(使わなくても良い)。';
						}
					} else {
						this.log('urlpreview.title is nothing');
					}
				}
			}
		}

		const systemInstruction: GeminiSystemInstruction = { parts: [{ text: systemInstructionText }] };

		parts = [{ text: aiChat.question }];
		if (files.length >= 1) {
			for (const file of files) {
				parts.push({
					inlineData: {
						mimeType: file.type,
						data: file.base64
					}
				});
			}
		}

		let contents: GeminiContents[] = [];
		if (aiChat.history != null) {
			aiChat.history.forEach((entry) => {
				contents.push({
					role: entry.role,
					parts: [{ text: entry.content }]
				});
			});
		}
		contents.push({ role: 'user', parts: parts });

		const geminiOptions: GeminiOptions = {
			contents: contents,
			systemInstruction: systemInstruction
		};

		// Grounding tool (Gemini v1beta: commonly `googleSearch`; some samples use `googleSearchRetrieval`)
		if (aiChat.grounding) {
			geminiOptions.tools = [{ googleSearch: {} as any }];
			// If your runtime expects the alternative name, swap to:
			// geminiOptions.tools = [{ googleSearchRetrieval: {} as any }];
		}

		const options = {
			url: aiChat.api,
			searchParams: {
				key: aiChat.key
			},
			json: geminiOptions
		};

		// Mask key in logs
		this.log(
			JSON.stringify({
				url: options.url,
				searchParams: { key: '***' },
				json: { ...geminiOptions, contents: '[omitted]' }
			})
		);

		let res_data: any = null;
		let responseText: string = '';
		try {
			res_data = await got.post(options).json();
			this.log(JSON.stringify(res_data));

			if (res_data?.candidates?.length > 0) {
				const candidate = res_data.candidates[0];
				if (candidate?.content?.parts?.length > 0) {
					for (const p of candidate.content.parts) {
						if (p?.text) responseText += p.text;
					}
				}

				// Grounding metadata (optional)
				if (candidate?.groundingMetadata) {
					let groundingMetadata = '';
					const gm = candidate.groundingMetadata;
					if (gm.groundingChunks?.length > 0) {
						const limit = Math.min(gm.groundingChunks.length, 3);
						for (let i = 0; i < limit; i++) {
							const ch = gm.groundingChunks[i];
							if (ch?.web?.uri && ch?.web?.title) {
								groundingMetadata += `参考(${i + 1}): [${ch.web.title}](${ch.web.uri})\n`;
							}
						}
					}
					if (gm.webSearchQueries?.length > 0) {
						groundingMetadata += '検索ワード: ' + gm.webSearchQueries.join(',') + '\n';
					}
					responseText += groundingMetadata;
				}
			}
		} catch (err: any) {
			this.log('Error By Call Gemini');
			if (err?.response) {
				this.log(`Status: ${err.response.statusCode}`);
				this.log(`Body: ${err.response.body}`);
			}
			if (err instanceof Error) {
				this.log(`${err.name}\n${err.message}\n${err.stack}`);
			}
		}
		return responseText;
	}

	@bindThis
	private async genTextByPLaMo(aiChat: AiChat) {
		this.log('Generate Text By PLaMo...');

		const options = {
			url: aiChat.api,
			headers: {
				Authorization: 'Bearer ' + aiChat.key
			},
			json: {
				model: 'plamo-beta',
				messages: [
					{ role: 'system', content: aiChat.prompt },
					{ role: 'user', content: aiChat.question }
				]
			}
		};
		this.log(JSON.stringify({ url: options.url, headers: { Authorization: 'Bearer ***' }, json: options.json }));

		let res_data: any = null;
		try {
			res_data = await got.post(options).json();
			this.log(JSON.stringify(res_data));
			if (res_data?.choices?.length > 0) {
				const choice = res_data.choices[0];
				if (choice?.message?.content) {
					return choice.message.content;
				}
			}
		} catch (err: any) {
			this.log('Error By Call PLaMo');
			if (err?.response) {
				this.log(`Status: ${err.response.statusCode}`);
				this.log(`Body: ${err.response.body}`);
			}
			if (err instanceof Error) {
				this.log(`${err.name}\n${err.message}\n${err.stack}`);
			}
		}
		return null;
	}

	@bindThis
	private async note2base64File(notesId: string) {
		const noteData = await this.ai.api('notes/show', { noteId: notesId });
		const files: base64File[] = [];
		let fileType: string | undefined,
			filelUrl: string | undefined;

		if (noteData !== null && noteData.hasOwnProperty('files')) {
			for (let i = 0; i < noteData.files.length; i++) {
				if (noteData.files[i].hasOwnProperty('type')) {
					fileType = noteData.files[i].type;
					if (noteData.files[i].hasOwnProperty('name')) {
						if (fileType === 'application/octet-stream' || fileType === 'application/xml') {
							fileType = 'text/plain';
						}
					}
				}
				if (noteData.files[i].thumbnailUrl) {
					filelUrl = noteData.files[i].thumbnailUrl;
				} else if (noteData.files[i].url) {
					filelUrl = noteData.files[i].url;
				}
				if (fileType !== undefined && filelUrl !== undefined) {
					try {
						this.log('filelUrl:' + filelUrl);
						const file = await urlToBase64(filelUrl);
						const base64file: base64File = { type: fileType, base64: file };
						files.push(base64file);
					} catch (err: unknown) {
						if (err instanceof Error) {
							this.log(`${err.name}\n${err.message}\n${err.stack}`);
						}
					}
				}
			}
		}
		return files;
	}

	@bindThis
	private async mentionHook(msg: Message) {
		if (!msg.includes([this.name])) {
			return false;
		} else {
			this.log('AiChat requested');
		}

		const conversationData = await this.ai.api('notes/conversation', { noteId: msg.id });

		let exist: AiChatHist | null = null;
		if (conversationData != undefined) {
			for (const message of conversationData) {
				exist = this.aichatHist.findOne({
					postId: message.id
				});
				if (exist != null) return false;
			}
		}

		let type = TYPE_GEMINI;
		if (msg.includes([KIGO + TYPE_GEMINI])) {
			type = TYPE_GEMINI;
		} else if (msg.includes([KIGO + 'chatgpt4'])) {
			type = 'chatgpt4';
		} else if (msg.includes([KIGO + 'chatgpt'])) {
			type = 'chatgpt3.5';
		} else if (msg.includes([KIGO + TYPE_PLAMO])) {
			type = TYPE_PLAMO;
		}

		const current: AiChatHist = {
			postId: msg.id,
			createdAt: Date.now(),
			type: type,
			fromMention: true
		};

		if (msg.quoteId) {
			const quotedNote = await this.ai.api('notes/show', {
				noteId: msg.quoteId
			});
			current.history = [
				{
					role: 'user',
					content: 'ユーザーが与えた前情報である、引用された文章: ' + quotedNote.text
				}
			];
		}

		const result = await this.handleAiChat(current, msg);

		if (result) {
			return {
				reaction: 'like'
			};
		}
		return false;
	}

	@bindThis
	private async contextHook(key: any, msg: Message) {
		this.log('contextHook...');
		if (msg.text == null) return false;

		const conversationData = await this.ai.api('notes/conversation', { noteId: msg.id });

		if (conversationData == null || conversationData.length == 0) {
			this.log('conversationData is nothing.');
			return false;
		}

		let exist: AiChatHist | null = null;
		for (const message of conversationData) {
			exist = this.aichatHist.findOne({
				postId: message.id
			});
			if (exist != null) break;
		}
		if (exist == null) {
			this.log('conversationData is not found.');
			return false;
		}

		this.log('unsubscribeReply & remove.');
		this.log(exist.type + ':' + exist.postId);
		if (exist.history) {
			for (const his of exist.history) {
				this.log(his.role + ':' + his.content);
			}
		}
		this.unsubscribeReply(key);
		this.aichatHist.remove(exist);

		const result = await this.handleAiChat(exist, msg);

		if (result) {
			return {
				reaction: 'like'
			};
		}
		return false;
	}

	@bindThis
	private async aichatRandomTalk() {
		this.log('AiChat(randomtalk) started');
		const tl = await this.ai.api('notes/local-timeline', {
			limit: 30
		});
		const interestedNotes = tl.filter(
			(note) =>
				note.userId !== this.ai.account.id &&
				note.text != null &&
				note.replyId == null &&
				note.renoteId == null &&
				note.cw == null &&
				note.files.length == 0 &&
				!note.user.isBot
		);

		if (interestedNotes == undefined || interestedNotes.length == 0) return false;

		const choseNote = interestedNotes[Math.floor(Math.random() * interestedNotes.length)];

		let exist: AiChatHist | null = null;

		exist = this.aichatHist.findOne({
			postId: choseNote.id
		});
		if (exist != null) return false;

		const childrenData = await this.ai.api('notes/children', { noteId: choseNote.id });
		if (childrenData != undefined) {
			for (const message of childrenData) {
				exist = this.aichatHist.findOne({
					postId: message.id
				});
				if (exist != null) return false;
			}
		}

		const conversationData = await this.ai.api('notes/conversation', { noteId: choseNote.id });
		if (conversationData != undefined) {
			for (const message of conversationData) {
				exist = this.aichatHist.findOne({
					postId: message.id
				});
				if (exist != null) return false;
			}
		}

		if (Math.random() < this.randomTalkProbability) {
			this.log('AiChat(randomtalk) targeted: ' + choseNote.id);
		} else {
			this.log('AiChat(randomtalk) is end.');
			return false;
		}
		const friend: Friend | null = this.ai.lookupFriend(choseNote.userId);
		if (friend == null || friend.love < 7) {
			this.log('AiChat(randomtalk) end.Because there was not enough affection.');
			return false;
		} else if (choseNote.user.isBot) {
			this.log('AiChat(randomtalk) end.Because message author is bot.');
			return false;
		}

		const current: AiChatHist = {
			postId: choseNote.id,
			createdAt: Date.now(),
			type: TYPE_GEMINI,
			fromMention: false
		};

		let targetedMessage = choseNote;
		if (choseNote.extractedText == undefined) {
			const data = await this.ai.api('notes/show', { noteId: choseNote.id });
			targetedMessage = new Message(this.ai, data);
		}
		const result = await this.handleAiChat(current, targetedMessage);

		if (result) {
			return {
				reaction: 'like'
			};
		}
		return false;
	}

	@bindThis
	private async handleAiChat(exist: AiChatHist, msg: Message) {
		let text: string | null, aiChat: AiChat;
		let prompt: string = '';
		if (config.prompt) {
			prompt = config.prompt;
		}
		const reName = RegExp(this.name, 'i');
		let reKigoType = RegExp(KIGO + exist.type, 'i');
		const extractedText = msg.extractedText;
		if (extractedText == undefined || extractedText.length == 0) return false;

		// Inline model override: &gemini-flash / &gemini-pro
		if (msg.includes([KIGO + GEMINI_FLASH])) {
			exist.api = makeGeminiApi('gemini-2.5-flash');
			reKigoType = RegExp(KIGO + GEMINI_FLASH, 'i');
		} else if (msg.includes([KIGO + GEMINI_PRO])) {
			exist.api = makeGeminiApi('gemini-2.5-pro');
			reKigoType = RegExp(KIGO + GEMINI_PRO, 'i');
		}

		if (msg.includes([GROUNDING_TARGET])) {
			exist.grounding = true;
		}
		if (exist.fromMention && config.aichatGroundingWithGoogleSearchAlwaysEnabled) {
			exist.grounding = true;
		}

		const friend: Friend | null = this.ai.lookupFriend(msg.userId);
		let friendName: string | undefined;
		if (friend != null && friend.name != null) {
			friendName = friend.name;
		} else if (msg.user.name) {
			friendName = msg.user.name;
		} else {
			friendName = msg.user.username;
		}

		const question = extractedText.replace(reName, '').replace(reKigoType, '').replace(GROUNDING_TARGET, '').trim();

		switch (exist.type) {
			case TYPE_GEMINI: {
				// API key required
				if (!config.geminiProApiKey) {
					msg.reply(serifs.aichat.nothing(exist.type));
					return false;
				}
				const base64Files: base64File[] = await this.note2base64File(msg.id);

				// Choose model from config; default = 2.5-flash
				const modelFromConfig = (config as any).geminiModel || 'gemini-2.5-flash';

				aiChat = {
					question,
					prompt,
					api: makeGeminiApi(modelFromConfig),
					key: config.geminiProApiKey,
					history: exist.history,
					friendName,
					fromMention: exist.fromMention
				};
				if (exist.api) aiChat.api = exist.api;
				if (exist.grounding) aiChat.grounding = exist.grounding;

				text = await this.genTextByGemini(aiChat, base64Files);
				break;
			}

			case TYPE_PLAMO: {
				if (!(config as any).pLaMoApiKey) {
					msg.reply(serifs.aichat.nothing(exist.type));
					return false;
				}
				aiChat = {
					question: msg.text!,
					prompt,
					api: PLAMO_API,
					key: (config as any).pLaMoApiKey,
					history: exist.history,
					friendName,
					fromMention: exist.fromMention
				};
				text = await this.genTextByPLaMo(aiChat);
				break;
			}

			default:
				msg.reply(serifs.aichat.nothing(exist.type));
				return false;
		}

		if (text == null || text == '') {
			this.log('The result is invalid. It seems that tokens and other items need to be reviewed.');
			msg.reply(serifs.aichat.error(exist.type));
			return false;
		}

		this.log('Replying...');
		msg.reply(serifs.aichat.post(text, exist.type)).then((reply) => {
			if (!exist.history) {
				exist.history = [];
			}
			exist.history.push({ role: 'user', content: question });
			exist.history.push({ role: 'model', content: text });
			if (exist.history.length > 10) {
				exist.history.shift();
			}
			this.aichatHist.insertOne({
				postId: reply.id,
				createdAt: Date.now(),
				type: exist.type,
				api: aiChat.api,
				history: exist.history,
				grounding: exist.grounding,
				fromMention: exist.fromMention
			});

			this.log('Subscribe&Set Timer...');
			this.subscribeReply(reply.id, reply.id);
			this.setTimeoutWithPersistence(TIMEOUT_TIME, {
				id: reply.id
			});
		});
		return true;
	}

	@bindThis
	private async timeoutCallback({ id }) {
		this.log('timeoutCallback...');
		const exist = this.aichatHist.findOne({
			postId: id
		});
		this.unsubscribeReply(id);
		if (exist != null) {
			this.aichatHist.remove(exist);
		}
	}
}
