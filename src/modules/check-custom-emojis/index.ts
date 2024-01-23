import { bindThis } from '@/decorators.js';
import loki from 'lokijs';
import Module from '@/module.js';
import serifs from '@/serifs.js';
import config from '@/config.js';
import Message from '@/message.js';

export default class extends Module {
	public readonly name = 'checkCustomEmojis';

	private lastEmoji: loki.Collection<{
		id: string;
		updatedAt: number;
	}>;

	@bindThis
	public install() {
		if (!config.checkEmojisEnabled) return {};
		this.lastEmoji = this.ai.getCollection('lastEmoji', {
			indices: ['id']
		});

		this.timeCheck();
		setInterval(this.timeCheck, 1000 * 60 * 3);

		return {
			mentionHook: this.mentionHook
		};
	}

	@bindThis
	private timeCheck() {
		const now = new Date();
		if (now.getHours() !== 23) return;
		const date = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
		const data = this.getData();
		if (data.lastPosted == date) return;
		data.lastPosted = date;
		this.setData(data);

		this.log('Time to Check CustomEmojis!');
		this.post();
	}

	@bindThis
	private async post() {
		this.log('Start to Check CustomEmojis.');
		const lastEmoji = this.lastEmoji.find({});

		const lastId = lastEmoji.length != 0 ? lastEmoji[0].id : null;
		const emojisData = await this.checkCumstomEmojis(lastId);
		if (emojisData.length == 0) {
			this.log('No CustomEmojis Added.');
			return;
		}

		// 絵文字データが取得された場合、元々のデータを削除しておく
		const emojiSize = emojisData.length;
		this.lastEmoji.remove(lastEmoji);

		const server_name = config.serverName ? config.serverName : 'このサーバー';
		this.log('Posting...');

		// 一気に投稿しないver
		if (!config.checkEmojisAtOnce){
			// 概要について投稿
			this.log(serifs.checkCustomEmojis.post(server_name, emojiSize));
			await this.ai.post({
				text: serifs.checkCustomEmojis.post(server_name, emojiSize)
			});

			// 各絵文字について投稿
			for (const emoji of emojisData){
				await this.ai.post({
					text: serifs.checkCustomEmojis.emojiPost(emoji.name)
				});
				this.log(serifs.checkCustomEmojis.emojiPost(emoji.name));
			}
		} else {
			// 一気に投稿ver
			let text = '';
			for (const emoji of emojisData){
				text += serifs.checkCustomEmojis.emojiOnce(emoji.name);
			}
			const message = serifs.checkCustomEmojis.postOnce(server_name, emojiSize, text);
			this.log(message);
			await this.ai.post({
				text: message
			});
		}

		// データの保存
		this.log('Last CustomEmojis data saving...');
		this.log(JSON.stringify(emojisData[emojiSize-1],null,'\t'));
		this.lastEmoji.insertOne({
			id: emojisData[emojiSize-1].id,
			updatedAt: Date.now()
		});
		this.log('Check CustomEmojis finished!');
	}

	@bindThis
	private async checkCumstomEmojis(lastId : any) {
		this.log('CustomEmojis fetching...');
		let emojisData;
		if(lastId != null){
			this.log('lastId is **not** null');
			emojisData = await this.ai.api('admin/emoji/list', {
				sinceId: lastId,
				limit: 30
			});
		} else {
			this.log('lastId is null');
			emojisData = await this.ai.api('admin/emoji/list', {
				limit: 100
			});

			// 最後まで取得
			let beforeEmoji = null;
			let afterEmoji = emojisData.length > 1 ? emojisData[0] : null;
			while(emojisData.length == 100 && beforeEmoji != afterEmoji){
				const lastId = emojisData[emojisData.length-1].id;
				// sinceIdを指定して再度取り直す
				emojisData = await this.ai.api('admin/emoji/list', {
					limit: 100,
					sinceId: lastId
				});
				beforeEmoji = afterEmoji;
				afterEmoji = emojisData.length > 1 ? emojisData[0] : null;
				await this.sleep(50);
			}

			// sinceIdが未指定の場合、末尾から5件程度にしておく
			let newJson: any[] = [];
			for (let i = emojisData.length - 5; i < emojisData.length; i++) {
				newJson.push(emojisData[i]);
			}
			emojisData = newJson;
		}
		return emojisData;
	}

	@bindThis
	private async mentionHook(msg: Message) {
		if (!msg.includes(['カスタムえもじチェック','カスタムえもじを調べて','カスタムえもじを確認'])) {
			return false;
		} else {
			this.log('Check CustomEmojis requested');
		}

		await this.post();

		return {
			reaction: 'like'
		};
	}

	@bindThis
	private async sleep(ms: number) {
		return new Promise((res) => setTimeout(res, ms));
	}
}
