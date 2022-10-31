import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';

type theCatApiReturnType = Readonly<{
	id: string,
	url: string,
	width: number,
	height: number
}>

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

    		try {
    		const file = await this.getCatImage();
    			// this.log(file);
    			this.log('Replying...');
    			msg.reply(message, {file});
    		} catch (e) {
    			console.log(e);
    			msg.reply('にゃ～ん？');
    		}


    		return {
    			reaction: ':blobcatmeltnomblobcatmelt:',
    		};
    	} else {
    		return false;
    	}
    }

    @autobind
    private async getCatImage() {
    	console.warn('attempt');
    	const res = await fetch('https://api.thecatapi.com/v1/images/search');
    	const theCatApi: theCatApiReturnType = (await res.json())[0];
    	const rawFile = await fetch(theCatApi.url);
    	const ext = theCatApi.url.split('.').pop();
    	const buffer = await rawFile.arrayBuffer();
    	const file = await this.ai.upload(Buffer.from(buffer), {
    		filename: `${theCatApi.id}.${ext}`,
    	});
    	return file;
    }
}
