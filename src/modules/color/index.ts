import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';
import { generateColorSample } from './render';

export default class extends Module {
	public readonly name = 'color';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (msg.text && msg.text.includes('色決めて')) {
            // rgbをそれぞれ乱数で生成する
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            // rgbをhexに変換する
            const hex = `${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
            const message = `RGB: ${r}, ${g}, ${b} (# ${hex})とかどう？`

			setTimeout(async () => {
				const file = await this.getColorSampleFile(r,g,b);
				this.log('Replying...');
				msg.reply(message, { file });
			}, 500);
			return {
				reaction: 'like'
			};
		} else {
			return false;
		}
	}

	@autobind
	private async getColorSampleFile(r,g,b): Promise<any> {
		const colorSample = generateColorSample(r,g,b);

		this.log('Image uploading...');
		const file = await this.ai.upload(colorSample, {
			filename: 'color.png',
			contentType: 'image/png'
		});

		return file;
	}
}
