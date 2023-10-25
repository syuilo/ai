import autobind from 'autobind-decorator';
import * as loki from 'lokijs';
import Module from '@/module';
import serifs from '@/serifs';
import config from '@/config';
import Message from '@/message';

export default class extends Module {
	public readonly name = 'checkCustomEmojis';

	private lastEmoji: loki.Collection<{
		id: string;
		updatedAt: number;
	}>;

	@autobind
	public install() {
		if (config.checkEmojisEnabled === false) return {};
		this.lastEmoji = this.ai.getCollection('lastEmoji', {
			indices: ['id']
		});

		this.timeCheck();
		setInterval(this.timeCheck, 1000 * 60 * 3);

		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
	private timeCheck() {
		const now = new Date();
		if (now.getHours() !== 23) return;
		const date = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
		const data = this.getData();
		if (data.lastPosted == date) return;
		data.lastPosted = date;
		this.setData(data);

		this.log('Time to check custom emojis!');
		this.post();
	}

	@autobind
	private async post() {
		this.log('Start to check custom emojis.');
		const lastEmoji = this.lastEmoji.find({});
		// this.log('lastEmoji');
		// this.log(JSON.stringify(lastEmoji,null,'\t'));

		const lastId = lastEmoji.length != 0 ? lastEmoji[0].id : null;
		const emojisData = await this.checkCumstomEmojis(lastId);
		if (emojisData.length == 0) return;

		// 絵文字データが取得された場合、元々のデータを削除しておく
		const emojiSize = emojisData.length;
		this.lastEmoji.remove(lastEmoji);

		// 概要について投稿
		const server_name = config.serverName ? config.serverName : 'このサーバー';
		this.log('Posting...');
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

		// データの保存
		this.log('Last custom emoji data saving...');
		this.log(JSON.stringify(emojisData[emojiSize-1],null,'\t'));
		this.lastEmoji.insertOne({
			id: emojisData[emojiSize-1].id,
			updatedAt: Date.now()
		});
		this.log('Check custom emojis finished!');
	}

	@autobind
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

	@autobind
	private async mentionHook(msg: Message) {
		if (!msg.includes(['カスタムえもじチェック'])) {
			return false;
		} else {
			this.log('Check custom emojis requested');
		}

		await this.post();

		return {
			reaction: 'like'
		};
	}

	@autobind
	private async sleep(ms: number) {
		return new Promise((res) => setTimeout(res, ms));
	}
}
