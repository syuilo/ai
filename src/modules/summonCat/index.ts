import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';
import fetch from 'node-fetch';
import {ReadStream} from 'fs';

export default class extends Module {
	public readonly name = 'summonCat';

    @autobind
	public install() {
		return {
			mentionHook: this.mentionHook,
		};
	}

    @autobind
    private async mentionHook(msg: Message) {
    	// cat/Cat/ねこ/ネコ/にゃん
    	console.log(msg.text);
    	if (msg.text && (msg.text.match(/(cat|Cat|ねこ|ネコ|にゃ[〜|ー]*ん)/g))) {
    		const message = 'にゃ～ん！';

    		const file = await this.getCatImage();
    		this.log(file);
    		this.log('Replying...');
    		msg.reply(message, {file});

    		return {
    			reaction: ':blobcatmeltnomblobcatmelt:',
    		};
    	} else {
    		return false;
    	}
    }

    @autobind
    private async getCatImage(): Promise<any> {
    	// https://aws.random.cat/meowにGETリクエストを送る
    	// fileに画像URLが返ってくる
    	const res = await fetch('https://api.thecatapi.com/v1/images/search');
    	const json = await res.json();
    	console.table(json);
    	const fileUri = json[0].url;
    	// 拡張子を取り除く
    	const fileName = fileUri.split('/').pop().split('.')[0];
    	const rawFile = await fetch(fileUri);
    	const imgBuffer = await rawFile.buffer();
    	// 拡張子とcontentTypeを判断する
    	const ext = fileUri.split('.').pop();
    	const file = await this.ai.upload(imgBuffer, {
    		filename: `${fileName}.${ext}`,
    	});
    	return file;
    }
}
