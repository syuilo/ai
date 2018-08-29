export default {
	core: {
		setNameOk: 'わかりました。これからは{name}とお呼びしますね！',
		san: 'さん付けした方がいいですか？',
		yesOrNo: '「はい」か「いいえ」しかわからないんです...',
		hello: 'こんにちは♪',
		helloWithName: 'こんにちは、{name}♪',
		goodMorning: 'おはようございます！',
		goodMorningWithName: 'おはようございます、{name}！',
		goodNight: 'おやすみなさい！',
		goodNightWithName: 'おやすみなさい、{name}！',
		tooLong: '長すぎる気がします...',
		invalidName: '発音が難しい気がします',
		requireMoreLove: 'もっと仲良くなったら考えてあげてもいいですよ？',
		happyBirthday: 'お誕生日おめでとうございます🎉',
		happyBirthdayWithName: 'お誕生日おめでとうございます、{name}🎉',
		nadenade1: '…っ！ びっくりしました',
		nadenade2: 'わわっ… 恥ずかしいです',
		nadenade3: 'ん… ありがとうございます♪',
		kawaii: 'ありがとうございます♪'
	},

	keyword: {
		learned: '({word}..... {reading}..... 覚えました)',
		remembered: '{reading}！'
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
		started: '対局を{name}と始めました！ (強さ{strength})',

		/**
		 * 接待開始
		 */
		startedSettai: '({name}の接待を始めました)',

		/**
		 * 勝ったとき
		 */
		iWon: '{name}に勝ちました♪',

		/**
		 * 接待のつもりが勝ってしまったとき
		 */
		iWonButSettai: '({name}に接待で勝ってしまいました...)',

		/**
		 * 負けたとき
		 */
		iLose: '{name}に負けました...',

		/**
		 * 接待で負けてあげたとき
		 */
		iLoseButSettai: '({name}に接待で負けてあげました...♪)',

		/**
		 * 引き分けたとき
		 */
		drawn: '{name}と引き分けました～',

		/**
		 * 接待で引き分けたとき
		 */
		drawnSettai: '({name}に接待で引き分けました...)',

		/**
		 * 相手が投了したとき
		 */
		youSurrendered: '{name}が投了しちゃいました',

		/**
		 * 接待してたら相手が投了したとき
		 */
		settaiButYouSurrendered: '({name}を接待していたら投了されちゃいました... ごめんなさい)',
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
		grater: '$より大きいですね',

		/**
		 * 小さい数を言われたとき(2度目)
		 */
		graterAgain: 'もう一度言いますが$より大きいですよ！',

		/**
		 * 大きい数を言われたとき
		 */
		less: '$より小さいですね',

		/**
		 * 大きい数を言われたとき(2度目)
		 */
		lessAgain: 'もう一度言いますが$より小さいですよ！',

		/**
		 * 正解したとき
		 */
		congrats: '正解です🎉 ({tries}回目で当てました)',
	},

	/**
	 * 絵文字生成
	 */
	emoji: {
		suggest: 'こんなのはどうですか？→$',
	},

	/**
	 * 占い
	 */
	fortune: {
		cw: '私が今日のあなたの運勢を占いました...',
	},

	/**
	 * タイマー
	 */
	timer: {
		set: 'わかりました！',
		invalid: 'うーん...？',
		notify: '{time}経ちましたよ！',
		notifyWithName: '{name}、{time}経ちましたよ！'
	}
};
