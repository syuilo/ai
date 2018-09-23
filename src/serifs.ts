// せりふ

export default {
	core: {
		setNameOk: name => `わかりました。これからは${name}とお呼びしますね！`,

		san: 'さん付けした方がいいですか？',

		yesOrNo: '「はい」か「いいえ」しかわからないんです...',

		hello: name => name ? `こんにちは、${name}♪` : `こんにちは♪`,

		helloNight: name => name ? `こんばんは、${name}♪` : `こんばんは♪`,

		goodMorning: (tension, name) => name ? `おはようございます、${name}！${tension}` : `おはようございます！${tension}`,

		goodNight: name => name ? `おやすみなさい、${name}！` : 'おやすみなさい！',

		okaeri: {
			love: name => name ? `おかえりなさい、${name}♪` : 'おかえりなさい♪',

			normal: name => name ? `おかえりなさい、${name}！` : 'おかえりなさい！',
		},

		itterassyai: {
			love: name => name ? `いってらっしゃい、${name}♪` : 'いってらっしゃい♪',

			normal: name => name ? `いってらっしゃい、${name}！` : 'いってらっしゃい！',
		},

		tooLong: '長すぎる気がします...',

		invalidName: '発音が難しい気がします',

		requireMoreLove: 'もっと仲良くなったら考えてあげてもいいですよ？',

		happyBirthday: name => name ? `お誕生日おめでとうございます、${name}🎉` : 'お誕生日おめでとうございます🎉',

		nadenade: {
			normal: 'ひゃっ…！ びっくりしました',

			love2: 'わわっ… 恥ずかしいです',

			love3: 'ん… ありがとうございます♪',

			hate1: '…っ！ やめてほしいです...',

			hate2: '触らないでください',

			hate3: '近寄らないでください',

			hate4: 'やめてください。通報しますよ？',
		},

		kawaii: {
			normal: 'ありがとうございます♪',

			love: '嬉しいです♪',

			hate: '…ありがとうございます'
		},

		suki: {
			normal: 'えっ… ありがとうございます…♪',

			love: name => `私もその… ${name}のこと好きですよ♪`,

			hate: null
		},

		hug: {
			normal: 'ぎゅー...',

			love: 'ぎゅーっ♪',

			hate: '離れてください...'
		},

		humu: {
			love: 'え、えっと…… ふみふみ……… どうですか…？',

			normal: 'えぇ... それはちょっと...',

			hate: '……'
		},

		batou: {
			love: 'おたんこなす！',

			normal: '(じとー…)',

			hate: '…頭大丈夫ですか？'
		}
	},

	keyword: {
		learned: (word, reading) => `(${word}..... ${reading}..... 覚えました)`,

		remembered: (word) => `${word}`
	},

	dice: {
		done: res => `${res} です！`
	},

	/**
	 * リバーシ
	 */
	reversi: {
		/**
		 * リバーシへの誘いを承諾するとき
		 */
		ok: '良いですよ～',

		/**
		 * リバーシへの誘いを断るとき
		 */
		decline: 'ごめんなさい、今リバーシはするなと言われてます...',

		/**
		 * 対局開始
		 */
		started: (name, strength) => `対局を${name}と始めました！ (強さ${strength})`,

		/**
		 * 接待開始
		 */
		startedSettai: name => `(${name}の接待を始めました)`,

		/**
		 * 勝ったとき
		 */
		iWon: name => `${name}に勝ちました♪`,

		/**
		 * 接待のつもりが勝ってしまったとき
		 */
		iWonButSettai: name => `(${name}に接待で勝ってしまいました...)`,

		/**
		 * 負けたとき
		 */
		iLose: name => `${name}に負けました...`,

		/**
		 * 接待で負けてあげたとき
		 */
		iLoseButSettai: name => `(${name}に接待で負けてあげました...♪)`,

		/**
		 * 引き分けたとき
		 */
		drawn: name => `${name}と引き分けました～`,

		/**
		 * 接待で引き分けたとき
		 */
		drawnSettai: name => `(${name}に接待で引き分けました...)`,

		/**
		 * 相手が投了したとき
		 */
		youSurrendered: name => `${name}が投了しちゃいました`,

		/**
		 * 接待してたら相手が投了したとき
		 */
		settaiButYouSurrendered: name => `(${name}を接待していたら投了されちゃいました... ごめんなさい)`,
	},

	/**
	 * 数当てゲーム
	 */
	guessingGame: {
		/**
		 * やろうと言われたけど既にやっているとき
		 */
		arleadyStarted: 'え、ゲームは既に始まってますよ！',

		/**
		 * タイムライン上で誘われたとき
		 */
		plzDm: 'メッセージでやりましょう！',

		/**
		 * ゲーム開始
		 */
		started: '0~100の秘密の数を当ててみてください♪',

		/**
		 * 数字じゃない返信があったとき
		 */
		nan: '数字でお願いします！「やめる」と言ってゲームをやめることもできますよ！',

		/**
		 * 中止を要求されたとき
		 */
		cancel: 'わかりました～。ありがとうございました♪',

		/**
		 * 小さい数を言われたとき
		 */
		grater: num => `${num}より大きいですね`,

		/**
		 * 小さい数を言われたとき(2度目)
		 */
		graterAgain: num => `もう一度言いますが${num}より大きいですよ！`,

		/**
		 * 大きい数を言われたとき
		 */
		less: num => `${num}より小さいですね`,

		/**
		 * 大きい数を言われたとき(2度目)
		 */
		lessAgain: num => `もう一度言いますが${num}より小さいですよ！`,

		/**
		 * 正解したとき
		 */
		congrats: tries => `正解です🎉 (${tries}回目で当てました)`,
	},

	/**
	 * 絵文字生成
	 */
	emoji: {
		suggest: emoji => `こんなのはどうですか？→${emoji}`,
	},

	/**
	 * 占い
	 */
	fortune: {
		cw: name => name ? `私が今日の${name}の運勢を占いました...` : '私が今日のあなたの運勢を占いました...',
	},

	/**
	 * タイマー
	 */
	timer: {
		set: 'わかりました！',

		invalid: 'うーん...？',

		tooLong: '長すぎます…',

		notify: (time, name) => name ? `${name}、${time}経ちましたよ！` : `${time}経ちましたよ！`
	},

	server: {
		cpu: 'サーバーの負荷が高そうです。大丈夫でしょうか...？'
	}
};
