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
	role: string;
	parts: [{text: string}]
};
type GeminiContents = {
	role: string;
	parts: GeminiParts;
};
type GeminiOptions = {
	contents?: GeminiContents[],
	systemInstruction?: GeminiSystemInstruction,
	tools?: [{}]
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
		url: string
		width: number;
		height: number;
		allow: []
	}
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

const GEMINI_20_FLASH_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
// const GEMINI_15_FLASH_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const GEMINI_15_PRO_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
const PLAMO_API = 'https://platform.preferredai.jp/api/completion/v1/chat/completions';

const RANDOMTALK_DEFAULT_PROBABILITY = 0.02;// デフォルトのrandomTalk確率
const TIMEOUT_TIME = 1000 * 60 * 60 * 0.5;// aichatの返信を監視する時間
const RANDOMTALK_DEFAULT_INTERVAL = 1000 * 60 * 60 * 12;// デフォルトのrandomTalk間隔

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

		// 確率は設定されていればそちらを採用(設定がなければデフォルトを採用)
		if (config.aichatRandomTalkProbability != undefined && !Number.isNaN(Number.parseFloat(config.aichatRandomTalkProbability))) {
			this.randomTalkProbability = Number.parseFloat(config.aichatRandomTalkProbability);
		}
		// ランダムトーク間隔(分)は設定されていればそちらを採用(設定がなければデフォルトを採用)
		if (config.aichatRandomTalkIntervalMinutes != undefined && !Number.isNaN(Number.parseInt(config.aichatRandomTalkIntervalMinutes))) {
			this.randomTalkIntervalMinutes = 1000 * 60 * Number.parseInt(config.aichatRandomTalkIntervalMinutes);
		}
		this.log('aichatRandomTalkEnabled:' + config.aichatRandomTalkEnabled);
		this.log('randomTalkProbability:' + this.randomTalkProbability);
		this.log('randomTalkIntervalMinutes:' + (this.randomTalkIntervalMinutes / (60 * 1000)));
		this.log('aichatGroundingWithGoogleSearchAlwaysEnabled:' + config.aichatGroundingWithGoogleSearchAlwaysEnabled);

		// 定期的にデータを取得しaichatRandomTalkを行う
		if (config.aichatRandomTalkEnabled) {
			setInterval(this.aichatRandomTalk, this.randomTalkIntervalMinutes);
		}

		return {
			mentionHook: this.mentionHook,
			contextHook: this.contextHook,
			timeoutCallback: this.timeoutCallback,
		};
	}

	@bindThis
	private async genTextByGemini(aiChat: AiChat, files:base64File[]) {
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
		// 設定のプロンプトに加え、現在時刻を渡す
		let systemInstructionText = aiChat.prompt + 'また、現在日時は' + now + 'であり、これは回答の参考にし、時刻を聞かれるまで時刻情報は提供しないこと(なお、他の日時は無効とすること)。';
		// 名前を伝えておく
		if (aiChat.friendName != undefined) {
			systemInstructionText += 'なお、会話相手の名前は' + aiChat.friendName + 'とする。';
		}
		// ランダムトーク機能(利用者が意図(メンション)せず発動)の場合、ちょっとだけ配慮しておく
		if (!aiChat.fromMention) {
			systemInstructionText += 'これらのメッセージは、あなたに対するメッセージではないことを留意し、返答すること(会話相手は突然話しかけられた認識している)。';
		}
		// グラウンディングについてもsystemInstructionTextに追記(こうしないとあまり使わないので)
		if (aiChat.grounding) {
			systemInstructionText += '返答のルール2:Google search with grounding.';
		}
		// URLから情報を取得
		if (aiChat.question !== undefined) {
			const urlexp = RegExp('(https?://[a-zA-Z0-9!?/+_~=:;.,*&@#$%\'-]+)', 'g');
			const urlarray = [...aiChat.question.matchAll(urlexp)];
			if (urlarray.length > 0) {
				for (const url of urlarray) {
					this.log('URL:' + url[0]);
					let result: unknown = null;
					try{
						result = await urlToJson(url[0]);
					} catch (err: unknown) {
						systemInstructionText += '補足として提供されたURLは無効でした:URL=>' + url[0]
						this.log('Skip url becase error in urlToJson');
						continue;
					}
					const urlpreview: UrlPreview = result as UrlPreview;
					if (urlpreview.title) {
						systemInstructionText +=
							'補足として提供されたURLの情報は次の通り:URL=>' + urlpreview.url
							+'サイト名('+urlpreview.sitename+')、';
						if (!urlpreview.sensitive) {
							systemInstructionText +=
							'タイトル('+urlpreview.title+')、'
							+ '説明('+urlpreview.description+')、'
							+ '質問にあるURLとサイト名・タイトル・説明を組み合わせ、回答の参考にすること。'
							;
							this.log('urlpreview.sitename:' + urlpreview.sitename);
							this.log('urlpreview.title:' + urlpreview.title);
							this.log('urlpreview.description:' + urlpreview.description);
						} else {
							systemInstructionText +=
							'これはセンシティブなURLの可能性があるため、質問にあるURLとサイト名のみで、回答の参考にすること(使わなくても良い)。'
							;
						}
					} else {
						// 多分ここにはこないが念のため
						this.log('urlpreview.title is nothing');
					}
				}
			}
		}
		const systemInstruction: GeminiSystemInstruction = {role: 'system', parts: [{text: systemInstructionText}]};

		parts = [{text: aiChat.question}];
		// ファイルが存在する場合、ファイルを添付して問い合わせ
		if (files.length >= 1) {
			for (const file of files){
				parts.push(
					{
						inlineData: {
							mimeType: file.type,
							data: file.base64,
						},
					}
				);
			}
		}

		// 履歴を追加
		let contents: GeminiContents[] = [];
		if (aiChat.history != null) {
			aiChat.history.forEach(entry => {
				contents.push({
					role : entry.role,
					parts: [{text: entry.content}],
				});
			});
		}
		contents.push({role: 'user', parts: parts});

		let geminiOptions:GeminiOptions = {
			contents: contents,
			systemInstruction: systemInstruction,
		};
		// gemini api grounding support. ref:https://github.com/google-gemini/cookbook/blob/09f3b17df1751297798c2b498cae61c6bf710edc/quickstarts/Search_Grounding.ipynb
		if (aiChat.grounding) {
			geminiOptions.tools = [{google_search:{}}];
		}
		let options = {
			url: aiChat.api,
			searchParams: {
				key: aiChat.key,
			},
			json: geminiOptions,
		};

		this.log(JSON.stringify(options));
		let res_data:any = null;
		let responseText:string = '';
		try {
			res_data = await got.post(options,
				{parseJson: (res: string) => JSON.parse(res)}).json();
			this.log(JSON.stringify(res_data));
			if (res_data.hasOwnProperty('candidates')) {
				if (res_data.candidates?.length > 0) {
					// 結果を取得
					if (res_data.candidates[0].hasOwnProperty('content')) {
						if (res_data.candidates[0].content.hasOwnProperty('parts')) {
							if (res_data.candidates[0].content.parts.length > 0) {
								for (let i = 0; i < res_data.candidates[0].content.parts.length; i++) {
									if (res_data.candidates[0].content.parts[i].hasOwnProperty('text')) {
										responseText += res_data.candidates[0].content.parts[i].text;
									}
								}
							}
						}
					}
					// groundingMetadataを取得
					let groundingMetadata = '';
					if (res_data.candidates[0].hasOwnProperty('groundingMetadata')) {
						// 参考サイト情報
						if (res_data.candidates[0].groundingMetadata.hasOwnProperty('groundingChunks')) {
							// 参考サイトが多すぎる場合があるので、3つに制限
							let checkMaxLength = res_data.candidates[0].groundingMetadata.groundingChunks.length;
							if (res_data.candidates[0].groundingMetadata.groundingChunks.length > 3) {
								checkMaxLength = 3;
							}
							for (let i = 0; i < checkMaxLength; i++) {
								if (res_data.candidates[0].groundingMetadata.groundingChunks[i].hasOwnProperty('web')) {
									if (res_data.candidates[0].groundingMetadata.groundingChunks[i].web.hasOwnProperty('uri')
											&& res_data.candidates[0].groundingMetadata.groundingChunks[i].web.hasOwnProperty('title')) {
										groundingMetadata += `参考(${i+1}): [${res_data.candidates[0].groundingMetadata.groundingChunks[i].web.title}](${res_data.candidates[0].groundingMetadata.groundingChunks[i].web.uri})\n`;
									}
								}
							}
						}
						// 検索ワード
						if (res_data.candidates[0].groundingMetadata.hasOwnProperty('webSearchQueries')) {
							if (res_data.candidates[0].groundingMetadata.webSearchQueries.length > 0) {
								groundingMetadata += '検索ワード: ' + res_data.candidates[0].groundingMetadata.webSearchQueries.join(',') + '\n';
							}
						}
					}
					responseText += groundingMetadata;
				}
			}
		} catch (err: unknown) {
			this.log('Error By Call Gemini');
			if (err instanceof Error) {
				this.log(`${err.name}\n${err.message}\n${err.stack}`);
			}
		}
		return responseText;
	}

	@bindThis
	private async genTextByPLaMo(aiChat: AiChat) {
		this.log('Generate Text By PLaMo...');

		let options = {
			url: aiChat.api,
			headers: {
				Authorization: 'Bearer ' + aiChat.key
			},
			json: {
				model: 'plamo-beta',
				messages: [
					{role: 'system', content: aiChat.prompt},
					{role: 'user', content: aiChat.question},
				],
			},
		};
		this.log(JSON.stringify(options));
		let res_data:any = null;
		try {
			res_data = await got.post(options,
				{parseJson: (res: string) => JSON.parse(res)}).json();
			this.log(JSON.stringify(res_data));
			if (res_data.hasOwnProperty('choices')) {
				if (res_data.choices.length > 0) {
					if (res_data.choices[0].hasOwnProperty('message')) {
						if (res_data.choices[0].message.hasOwnProperty('content')) {
							return res_data.choices[0].message.content;
						}
					}
				}
			}
		} catch (err: unknown) {
			this.log('Error By Call PLaMo');
			if (err instanceof Error) {
				this.log(`${err.name}\n${err.message}\n${err.stack}`);
			}
		}
		return null;
	}

	@bindThis
	private async note2base64File(notesId: string) {
		const noteData = await this.ai.api('notes/show', { noteId: notesId });
		let files:base64File[] = [];
		let fileType: string | undefined, filelUrl: string | undefined;
		if (noteData !== null && noteData.hasOwnProperty('files')) {
			for (let i = 0; i < noteData.files.length; i++) {
				if (noteData.files[i].hasOwnProperty('type')) {
					fileType = noteData.files[i].type;
					if (noteData.files[i].hasOwnProperty('name')) {
						// 拡張子で挙動を変えようと思ったが、text/plainしかMisskeyで変になってGemini対応してるものがない？
						// let extention = noteData.files[i].name.split('.').pop();
						if (fileType === 'application/octet-stream' || fileType === 'application/xml') {
							fileType = 'text/plain';
						}
					}
				}
				if (noteData.files[i].hasOwnProperty('thumbnailUrl') && noteData.files[i].thumbnailUrl) {
					filelUrl = noteData.files[i].thumbnailUrl;
				} else if (noteData.files[i].hasOwnProperty('url') && noteData.files[i].url) {
					filelUrl = noteData.files[i].url;
				}
				if (fileType !== undefined && filelUrl !== undefined) {
					try {
						this.log('filelUrl:'+filelUrl);
						const file = await urlToBase64(filelUrl);
						const base64file:base64File = {type: fileType, base64: file};
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

		// msg.idをもとにnotes/conversationを呼び出し、会話中のidかチェック
		const conversationData = await this.ai.api('notes/conversation', { noteId: msg.id });

		// aichatHistに該当のポストが見つかった場合は会話中のためmentionHoonkでは対応しない
		let exist : AiChatHist | null = null;
		if (conversationData != undefined) {
			for (const message of conversationData) {
				exist = this.aichatHist.findOne({
					postId: message.id
				});
				if (exist != null) return false;
			}
		}

		// タイプを決定
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
		const current : AiChatHist = {
			postId: msg.id,
			createdAt: Date.now(),// 適当なもの
			type: type,
			fromMention: true,
		};
		// 引用している場合、情報を取得しhistoryとして与える
		if (msg.quoteId) {
			const quotedNote = await this.ai.api('notes/show', {
				noteId: msg.quoteId,
			});
			current.history = [
				{
					role: 'user',
					content:
						'ユーザーが与えた前情報である、引用された文章: ' +
						quotedNote.text,
				},
			];
		}
		// AIに問い合わせ
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

		// msg.idをもとにnotes/conversationを呼び出し、該当のidかチェック
		const conversationData = await this.ai.api('notes/conversation', { noteId: msg.id });

		// 結果がnullやサイズ0の場合は終了
		if (conversationData == null || conversationData.length == 0 ) {
			this.log('conversationData is nothing.');
			return false;
		}

		// aichatHistに該当のポストが見つからない場合は終了
		let exist : AiChatHist | null = null;
		for (const message of conversationData) {
			exist = this.aichatHist.findOne({
				postId: message.id
			});
			// 見つかった場合はそれを利用
			if (exist != null) break;
		}
		if (exist == null) {
			this.log('conversationData is not found.');
			return false;
		}

		// 見つかった場合はunsubscribe&removeし、回答。今回のでsubscribe,insert,timeout設定
		this.log('unsubscribeReply & remove.');
		this.log(exist.type + ':' + exist.postId);
		if (exist.history) {
			for (const his of exist.history) {
				this.log(his.role + ':' + his.content);
			}
		}
		this.unsubscribeReply(key);
		this.aichatHist.remove(exist);

		// AIに問い合わせ
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
		const interestedNotes = tl.filter(note =>
			note.userId !== this.ai.account.id &&
			note.text != null &&
			note.replyId == null &&
			note.renoteId == null &&
			note.cw == null &&
			note.files.length == 0 &&
			!note.user.isBot
		);

		// 対象が存在しない場合は処理終了
		if (interestedNotes == undefined || interestedNotes.length == 0) return false;

		// ランダムに選択
		const choseNote = interestedNotes[Math.floor(Math.random() * interestedNotes.length)];

		// aichatHistに該当のポストが見つかった場合は会話中のためaichatRandomTalkでは対応しない
		let exist : AiChatHist | null = null;

		// 選択されたノート自体が会話中のidかチェック
		exist = this.aichatHist.findOne({
			postId: choseNote.id
		});
		if (exist != null) return false;

		// msg.idをもとにnotes/childrenを呼び出し、会話中のidかチェック
		const childrenData = await this.ai.api('notes/children', { noteId: choseNote.id });
		if (childrenData != undefined) {
			for (const message of childrenData) {
				exist = this.aichatHist.findOne({
					postId: message.id
				});
				if (exist != null) return false;
			}
		}

		// msg.idをもとにnotes/conversationを呼び出し、会話中のidかチェック
		const conversationData = await this.ai.api('notes/conversation', { noteId: choseNote.id });
		if (conversationData != undefined) {
			for (const message of conversationData) {
				exist = this.aichatHist.findOne({
					postId: message.id
				});
				if (exist != null) return false;
			}
		}

		// 確率をクリアし、親愛度が指定以上、かつ、Botでない場合のみ実行
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

		const current : AiChatHist = {
			postId: choseNote.id,
			createdAt: Date.now(),// 適当なもの
			type: TYPE_GEMINI,		// 別のAPIをデフォルトにしてもよい
			fromMention: false,		// ランダムトークの場合はfalseとする
		};
		// AIに問い合わせ
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

		// Gemini API用にAPIのURLと置き換え用タイプを変更
		if (msg.includes([KIGO + GEMINI_FLASH])) {
			exist.api = GEMINI_20_FLASH_API;
			reKigoType = RegExp(KIGO + GEMINI_FLASH, 'i');
		} else if (msg.includes([KIGO + GEMINI_PRO])) {
			exist.api = GEMINI_15_PRO_API;
			reKigoType = RegExp(KIGO + GEMINI_PRO, 'i');
		}

		// groudingサポート
		if (msg.includes([GROUNDING_TARGET])) {
			exist.grounding = true;
		}
		// 設定で、デフォルトgroundingがONの場合、メンションから来たときは強制的にgroundingをONとする(ランダムトークの場合は勝手にGoogle検索するのちょっと気が引けるため...)
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

		const question = extractedText
							.replace(reName, '')
							.replace(reKigoType, '')
							.replace(GROUNDING_TARGET, '')
							.trim();
		switch (exist.type) {
			case TYPE_GEMINI:
				// geminiの場合、APIキーが必須
				if (!config.geminiProApiKey) {
					msg.reply(serifs.aichat.nothing(exist.type));
					return false;
				}
				const base64Files: base64File[] = await this.note2base64File(msg.id);
				aiChat = {
					question: question,
					prompt: prompt,
					api: GEMINI_20_FLASH_API,
					key: config.geminiProApiKey,
					history: exist.history,
					friendName: friendName,
					fromMention: exist.fromMention
				};
				if (exist.api) {
					aiChat.api = exist.api;
				}
				if (exist.grounding) {
					aiChat.grounding = exist.grounding;
				}
				text = await this.genTextByGemini(aiChat, base64Files);
				break;

			case TYPE_PLAMO:
				// PLaMoの場合、APIキーが必須
				if (!config.pLaMoApiKey) {
					msg.reply(serifs.aichat.nothing(exist.type));
					return false;
				}
				aiChat = {
					question: msg.text,
					prompt: prompt,
					api: PLAMO_API,
					key: config.pLaMoApiKey,
					history: exist.history,
					friendName: friendName,
					fromMention: exist.fromMention
				};
				text = await this.genTextByPLaMo(aiChat);
				break;

			default:
				msg.reply(serifs.aichat.nothing(exist.type));
				return false;
		}

		if (text == null || text == '') {
			this.log('The result is invalid. It seems that tokens and other items need to be reviewed.')
			msg.reply(serifs.aichat.error(exist.type));
			return false;
		}

		this.log('Replying...');
		msg.reply(serifs.aichat.post(text, exist.type)).then(reply => {
			// 履歴に登録
			if (!exist.history) {
				exist.history = [];
			}
			exist.history.push({ role: 'user', content: question });
			exist.history.push({ role: 'model', content: text });
			// 履歴が10件を超えた場合、古いものを削除
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
				fromMention: exist.fromMention,
			});

			this.log('Subscribe&Set Timer...');

			// メンションをsubscribe
			this.subscribeReply(reply.id, reply.id);

			// タイマーセット
			this.setTimeoutWithPersistence(TIMEOUT_TIME, {
				id: reply.id
			});
		});
		return true;
	}

	@bindThis
	private async timeoutCallback({id}) {
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
