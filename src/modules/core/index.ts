import autobind from 'autobind-decorator';
import { HandlerResult } from '../../ai';
import Module from '../../module';
import MessageLike from '../../message-like';
import serifs, { getSerif } from '../../serifs';
import getDate from '../../utils/get-date';

const titles = ['さん', 'くん', '君', 'ちゃん', '様', '先生'];

const invalidChars = ['@', '#', '*', ':', '(', '[', ' ', '　'];

export default class CoreModule extends Module {
	public readonly name = 'core';

	@autobind
	public install() {
		return {
			onMention: this.onMention,
			onContextReply: this.onContextReply
		};
	}

	@autobind
	private onMention(msg: MessageLike) {
		if (!msg.text) return false;

		return (
			this.setName(msg) ||
			this.greet(msg) ||
			this.nadenade(msg) ||
			this.kawaii(msg) ||
			this.suki(msg) ||
			this.hug(msg) ||
			this.humu(msg) ||
			this.batou(msg) ||
			this.ponkotu(msg) ||
			this.rmrf(msg) ||
			this.shutdown(msg)
		);
	}

	@autobind
	private setName(msg: MessageLike): boolean  {
		if (!msg.text) return false;
		if (!msg.text.includes('って呼んで')) return false;
		if (msg.text.startsWith('って呼んで')) return false;

		// メッセージのみ
		if (!msg.isMessage) return true;

		if (msg.friend.love < 5) {
			msg.reply(serifs.core.requireMoreLove);
			return true;
		}

		const name = msg.text.match(/^(.+?)って呼んで/)[1];

		if (name.length > 10) {
			msg.reply(serifs.core.tooLong);
			return true;
		}

		if (invalidChars.some(c => name.includes(c))) {
			msg.reply(serifs.core.invalidName);
			return true;
		}

		const withSan = titles.some(t => name.endsWith(t));

		if (withSan) {
			msg.friend.updateName(name);
			msg.reply(serifs.core.setNameOk(name));
		} else {
			msg.reply(serifs.core.san).then(reply => {
				this.subscribeReply(msg.userId, msg.isMessage, msg.isMessage ? msg.userId : reply.id, {
					name: name
				});
			});
		}

		return true;
	}

	@autobind
	private greet(msg: MessageLike): boolean {
		if (msg.text == null) return false;

		const incLove = () => {
			//#region 1日に1回だけ親愛度を上げる
			const today = getDate();

			const data = msg.friend.getPerModulesData(this);

			if (data.lastGreetedAt == today) return;

			data.lastGreetedAt = today;
			msg.friend.setPerModulesData(this, data);

			msg.friend.incLove();
			//#endregion
		};

		// 末尾のエクスクラメーションマーク
		const tension = (msg.text.match(/[！!]{2,}/g) || [''])
			.sort((a, b) => a.length < b.length ? 1 : -1)[0]
			.substr(1);

		if (msg.includes(['こんにちは', 'こんにちわ'])) {
			msg.reply(serifs.core.hello(msg.friend.name));
			incLove();
			return true;
		}

		if (msg.includes(['こんばんは', 'こんばんわ'])) {
			msg.reply(serifs.core.helloNight(msg.friend.name));
			incLove();
			return true;
		}

		if (msg.includes(['おは', 'おっは', 'お早う'])) {
			msg.reply(serifs.core.goodMorning(tension, msg.friend.name));
			incLove();
			return true;
		}

		if (msg.includes(['おやすみ', 'お休み'])) {
			msg.reply(serifs.core.goodNight(msg.friend.name));
			incLove();
			return true;
		}

		if (msg.includes(['行ってくる', '行ってきます', 'いってくる', 'いってきます'])) {
			msg.reply(
				msg.friend.love >= 7
					? serifs.core.itterassyai.love(msg.friend.name)
					: serifs.core.itterassyai.normal(msg.friend.name));
			incLove();
			return true;
		}

		if (msg.includes(['ただいま'])) {
			msg.reply(
				msg.friend.love >= 7
					? serifs.core.okaeri.love(msg.friend.name)
					: serifs.core.okaeri.normal(msg.friend.name));
			incLove();
			return true;
		}

		return false;
	}

	@autobind
	private nadenade(msg: MessageLike): boolean {
		if (!msg.includes(['なでなで'])) return false;

		// メッセージのみ
		if (!msg.isMessage) return true;

		//#region 1日に1回だけ親愛度を上げる(嫌われてない場合のみ)
		if (msg.friend.love >= 0) {
			const today = getDate();

			const data = msg.friend.getPerModulesData(this);

			if (data.lastNadenadeAt != today) {
				data.lastNadenadeAt = today;
				msg.friend.setPerModulesData(this, data);

				msg.friend.incLove();
			}
		}
		//#endregion

		msg.reply(getSerif(
			msg.friend.love >= 10 ? serifs.core.nadenade.love3 :
			msg.friend.love >= 5 ? serifs.core.nadenade.love2 :
			msg.friend.love <= -15 ? serifs.core.nadenade.hate4 :
			msg.friend.love <= -10 ? serifs.core.nadenade.hate3 :
			msg.friend.love <= -5 ? serifs.core.nadenade.hate2 :
			msg.friend.love <= -1 ? serifs.core.nadenade.hate1 :
			serifs.core.nadenade.normal
		));

		return true;
	}

	@autobind
	private kawaii(msg: MessageLike): boolean {
		if (!msg.includes(['かわいい', '可愛い'])) return false;

		// メッセージのみ
		if (!msg.isMessage) return true;

		msg.reply(
			msg.friend.love >= 5 ? serifs.core.kawaii.love :
			msg.friend.love <= -3 ? serifs.core.kawaii.hate :
			serifs.core.kawaii.normal);

		return true;
	}

	@autobind
	private suki(msg: MessageLike): boolean {
		if (!msg.or(['好き', 'すき'])) return false;

		// メッセージのみ
		if (!msg.isMessage) return true;

		msg.reply(
			msg.friend.love >= 5 ? (msg.friend.name ? serifs.core.suki.love(msg.friend.name) : serifs.core.suki.normal) :
			msg.friend.love <= -3 ? serifs.core.suki.hate :
			serifs.core.suki.normal);

		return true;
	}

	@autobind
	private hug(msg: MessageLike): boolean {
		if (!msg.or(['ぎゅ', 'むぎゅ', /^はぐ(し(て|よ|よう)?)?$/])) return false;

		// メッセージのみ
		if (!msg.isMessage) return true;

		//#region 前のハグから1分経ってない場合は返信しない
		// これは、「ハグ」と言って「ぎゅー」と返信したとき、相手が
		// それに対してさらに「ぎゅー」と返信するケースがあったため。
		// そうするとその「ぎゅー」に対してもマッチするため、また
		// 藍がそれに返信してしまうことになり、少し不自然になる。
		// これを防ぐために前にハグしてから少し時間が経っていないと
		// 返信しないようにする
		const now = Date.now();

		const data = msg.friend.getPerModulesData(this);

		if (data.lastHuggedAt != null) {
			if (now - data.lastHuggedAt < (1000 * 60)) return true;
		}

		data.lastHuggedAt = now;
		msg.friend.setPerModulesData(this, data);
		//#endregion

		msg.reply(
			msg.friend.love >= 5 ? serifs.core.hug.love :
			msg.friend.love <= -3 ? serifs.core.hug.hate :
			serifs.core.hug.normal);

		return true;
	}

	@autobind
	private humu(msg: MessageLike): boolean {
		if (!msg.includes(['踏んで'])) return false;

		// メッセージのみ
		if (!msg.isMessage) return true;

		msg.reply(
			msg.friend.love >= 5 ? serifs.core.humu.love :
			msg.friend.love <= -3 ? serifs.core.humu.hate :
			serifs.core.humu.normal);

		return true;
	}

	@autobind
	private batou(msg: MessageLike): boolean {
		if (!msg.includes(['罵倒して', '罵って'])) return false;

		// メッセージのみ
		if (!msg.isMessage) return true;

		msg.reply(
			msg.friend.love >= 5 ? serifs.core.batou.love :
			msg.friend.love <= -5 ? serifs.core.batou.hate :
			serifs.core.batou.normal);

		return true;
	}

	@autobind
	private ponkotu(msg: MessageLike): boolean | HandlerResult {
		if (!msg.includes(['ぽんこつ'])) return false;

		msg.friend.decLove();

		return {
			reaction: 'angry'
		};
	}

	@autobind
	private rmrf(msg: MessageLike): boolean | HandlerResult {
		if (!msg.includes(['rm -rf'])) return false;

		msg.friend.decLove();

		return {
			reaction: 'angry'
		};
	}

	@autobind
	private shutdown(msg: MessageLike): boolean | HandlerResult {
		if (!msg.includes(['shutdown'])) return false;

		msg.reply(serifs.core.shutdown);

		return {
			reaction: 'confused'
		};
	}

	@autobind
	private onContextReply(msg: MessageLike, data: any) {
		if (msg.text == null) return;

		const done = () => {
			msg.reply(serifs.core.setNameOk(msg.friend.name));
			this.unsubscribeReply(msg.userId);
		};

		if (msg.text.includes('はい')) {
			msg.friend.updateName(data.name + 'さん');
			done();
		} else if (msg.text.includes('いいえ')) {
			msg.friend.updateName(data.name);
			done();
		} else {
			msg.reply(serifs.core.yesOrNo).then(reply => {
				this.subscribeReply(msg.userId, msg.isMessage, reply.id, data);
			});
		}
	}
}
