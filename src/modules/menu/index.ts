import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';
import { JSDOM } from 'jsdom';

export default class extends Module {
    public readonly name = 'menu';

    @autobind
    public install() {
        return {
            mentionHook: this.mentionHook
        };
    }

    @autobind
    private async mentionHook(msg: Message): Promise<boolean> {
        if (msg.text && msg.text.includes('ごはん')) {
            // 1~2535111の適当な数字を取得
            const random_number = Math.floor(Math.random() * 2535111) + 1;
            const url = `https://cookpad.com/recipe/${random_number}`;
            //testUrlして、200以外なら再取得
            const res = await fetch(url);
            if (res.status !== 200) {
                return this.mentionHook(msg);
            } else {
                //jsdomを利用してレシピのタイトルを取得
                const dom = new JSDOM(await res.text());
                //@ts-ignore
                let title = dom.window.document.querySelector('h1.recipe-title').textContent;
                // titleから改行を除去
                title = title!.replace(/\n/g, '');
                msg.reply(`こんなのどう？> [${title}](${url})`, {
                    immediate: true
                });
                return true;
            }
        }
        return false;
    }
}
