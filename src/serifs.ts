// Dialogue

export default {
	core: {
		setNameOk: name => `Okay, I'll call you ${name} from now on!`,

	san: 'Should I use san?',

	yesOrNo: 'I can only say yes or no...',

	hello: name => name ? `Hello, ${name}♪` : `Hello♪`,

	helloNight: name => name ? `Good evening, ${name}♪` : `Good evening♪`,

	goodMorning: (tension, name) => name ? `Good morning, ${name}! ${tension}` : `Good morning! ${tension}`,

		/*
		goodMorning: {
			normal: (tension, name) => name ? `Good morning, ${name}! ${tension}` : `Good morning! ${tension}`,

			hiru: (tension, name) => name ? `Good morning, ${name}! ${tension}It's already lunchtime, isn't it? ${tension}` : `Good morning! ${tension}It's already lunchtime, isn't it? ${tension}`,
		},
*/

	goodNight: name => name ? `Good night, ${name}!` : 'Good night!',

	omedeto: name => name ? `Thank you, ${name}♪` : 'Thank you♪',

		erait: {
			general: name => name ? [
				`${name}、Great job today too!`,
				`${name}、You did a great job today too!`
			] : [
				`Great job today too!`,
				`You did a great job today too!`
			],

			specify: (thing, name) => name ? [
				`${name}, ${thing} is great! `,
				`${name}, ${thing} is great~♪`
			] : [
				`${thing} is great! `,
				`${thing} is great~♪`
			],

			specify2: (thing, name) => name ? [
				`${name}、${thing}That's great!`,
				`${name}、${thing}That's great!♪`
			] : [
				`${thing}That's great!`,
				`${thing}That's great!♪`
			],
		},

		okaeri: {
			love: name => name ? [
				`welcome home, ${name}♪`,
				`Welcome back, ${name}.`
			] : [
				'Welcome back♪',
				'Welcome back, master.'
			],

			love2: name => name ? `Welcome back ♡♡♡ ${name} ♡♡♡` : 'Welcome back ♡♡♡Master♡♡♡',

			normal: name => name ? `welcome home, ${name}！` : 'welcome home!',
		},

		itterassyai: {
			love: name => name ? `Take care, ${name}♪` : 'Take care♪',

			normal: name => name ? `Take care, ${name}!` : 'Take care!',
		},

		tooLong: 'It feels too long...',

		invalidName: 'I find it difficult to pronounce',

		nadenade: {
			normal: 'Wow... I was surprised!',

			love2: ["Wow... I'm embarrassed', 'Ahhh... I'm embarrassed...', 'Huh...?"],

			love3: ['Mmm... Thank you♪', 'Wow, I feel so calm♪', 'Kyuuuh... I feel relieved...', "I'm getting sleepy..."],

			hate1: '…! I want you to stop...',

			hate2: "Don't touch me",

			hate3: 'Keep Away',

			hate4: "Please stop. I'll report you.",
		},

		kawaii: {
			normal: ['Thank you ♪', "I'm embarrassed..."],

			love: ["I'm happy♪", "I'm embarrassed..."],

			hate: '…thank you'
		},

		suki: {
			normal: 'Eh... Thank you...?',

			love: name => `I love you too... ${name}!`,

			hate: null
		},

		hug: {
			normal: 'Hug...',

			love: 'Hug ♪',

			hate: 'Please go away...'
		},

		humu: {
			love: "Um, well... let's see... what do you think...?",

			normal: "Uh... that's a bit...",

			hate: '……'
		},

		batou: {
			love: 'Um... you idiot...?',

			normal: '(Still...)',

			hate: '...Are you okay in the head?'
		},

		itai: name => name ? `${name}, are you okay? Ouch, ouch, ouch, go away! ` : 'Are you okay? Ouch, ouch, ouch, go away!',

		ote: {
			normal: "Hmm... I'm not a doggy...",

			love1: 'Woof!',

			love2: 'Woof woof ♪',
		},

		shutdown: "I'm not sleepy yet...",

		transferNeedDm: "Ok, why don't we discuss that in chat?",

		transferCode: code => `Okay. \n The password is "${code}"!`,

		transferFailed: 'Hmm, maybe the password is wrong...?',

		transferDone: name => name ? `Ha...! Welcome back, ${name}! `: `Ha...! Welcome back!`,
	},

	keyword: {
		learned: (word, reading) => `(${word}..... ${reading}..... I remembered).`,

		remembered: (word) => `${word}`
	},

	dice: {
		done: res => `${res} is!`
	},

	birthday: {
		happyBirthday: name => name ? `Happy Birthday, ${name}🎉` : 'Happy Birthday 🎉',
	},

	/**
	* Reversi
	*/
		reversi: {
		/**
		* When accepting an invitation to play Reversi
		*/
		ok: 'Sure, sure',
		/**
		* When declining an invitation to play Reversi
		*/
		decline: "Sorry, I'm not allowed to play Reversi right now...",
		/**
		* Start of game
		*/
		started: (name, strength) => `Started a game with ${name}! (strength ${strength})`,

		/**
		* Start of entertainment
		*/
		startedSettai: name => `(Started entertainment for ${name})`,

		/**
		* When you win
		*/
		iWon: name => `I won against ${name}♪`,

		/**
		* When you intended to entertain but ended up winning
		*/
		iWonButSettai: name => `(I won against ${name} in entertainment...)`,

		/**
		* When you lose
		*/
		iLose: name => `I lost against ${name}...`,

		/**
		* When you lose in entertainment
		*/
		iLoseButSettai: name => `(I lost in entertainment for ${name}...♪)`,

		/**
		* When you draw
		*/
		drawn: name => `I drew with ${name}~`,

		/**
		* When you draw in entertainment
		*/
		drawnSettai: name => `(Drawn with ${name}...)`,

		/**
		 * When your opponent resigns
		 */
		youSurrendered: name => `${name} But I gave up.`,

		/**
		 * 接待してたら相手が投了したとき
		 */
		settaiButYouSurrendered: name => `(I was entertaining ${name} when he resigned... sorry)`,
	},

	/**
	* Guessing Game
	*/
		guessingGame: {
		/**
		* When you are asked to play but are already playing
		*/
		alreadyStarted: 'Oh, the game has already started!',

		/**
		* When you are invited on the timeline
		*/
		plzDm: "Let's play by message!",

		/**
		* Start of the game
		*/
		started: 'Try to guess the secret number between 0 and 100♪',

		/**
		* When you get a reply that is not a number
		*/
		nan: 'Please use a number! You can also quit the game by saying "quit"!',

		/**
		* When you are asked to stop
		*/
		cancel: 'Okay. Thank you♪',

		/**
		* When you are told a small number
		*/
		grater: num => "It's bigger than ${num}",

		/**
		* When you are told a small number (2nd time)
		*/
		graterAgain: num => "I'll say it again, it's bigger than ${num}!",

		/**
		* When you are told a large number
		*/
		less: num => "It's smaller than ${num}",

		/**
		* When a large number is said (second time)
		*/
		lessAgain: num => "I'll say it again, it's less than ${num}!",

		/**
		* When you get the answer right
		*/
		congrats: tries => `You got it right🎉 (You got it right on the ${tries}th try)`,
	},

	/**
	 * Counting Game
	 */
	kazutori: {
		alreadyStarted: "I'm just doing it now",

		matakondo: "Let's do it again next time!",

		intro: minutes => `Everyone, let's play a counting game! \nThe person who gets the highest number between 0 and 100 wins. You can't overlap with someone else's number~ \nThe time limit is ${minutes} minutes. Please send your number as a reply to this post!`,

		finish: 'The results of the game are announced!',

		finishWithWinner: (user, name) => name ? `This time, ${user}(${name}) won! Let's do it again♪` : `This time, ${user}(${name}) won! Let's do it again♪`,

		finishWithNoWinner: "There was no winner this time... let's do it again ♪",

		onagare: 'It was cancelled due to lack of participants...'
	},

	/**
	 * Emoji Generation
	 */
	emoji: {
		suggest: emoji => `How about this?→ ${emoji}`,
	},

	/**
	 * Fortune telling
	 */
	fortune: {
		cw: name => name ? "I've done ${name}'s fortune for today..." : "I've done your fortune for today...",
	},

	/**
	 * timer
	 */
	timer: {
		set: 'Okay!',

		invalid: 'Hmm...?',

		tooLong: 'Too long...',

		notify: (time, name) => name ? `${name}, ${time} has passed!` : `${time} has passed!`
	},

	/**
	 * Reminders
	 */
	reminder: {
		invalid: 'Hmm...?',

		doneFromInvalidUser: "Don't play pranks!",

		reminds: "Here's your to-do list!",

		notify: (name) => name ? `Did ${name} do this? ` : `Did you do this? `,

		notifyWithThing: (thing, name) => name ? `Did ${name} do "${thing}"? ` : `Did you do "${thing}"? `,
		done: (name) => name ? [
			`Well done, ${name}♪`,
			`${name}、As expected!`,
			`${name}、That's amazing...!`,
		] : [
			`Well done!`,
			`As expected!`,
			`That's amazing...!`,
		],

		cancel: `got it.`,
	},

	/**
	 * Valentine
	 */
	valentine: {
		chocolateForYou: name => name ? `${name}、Well... I made some chocolate, so please feel free to try it! 🍫` : 'I made some chocolate, so please feel free to try it! 🍫',
	},

	server: {
		cpu: 'The server seems to be under heavy load. Is it okay...?'
	},

	maze: {
		post: 'Today's maze! #AiMaze',
		foryou: 'I drew it!'
	},

	chart: {
		post: 'The number of instances posted!',
		foryou: 'I drew it!'
	},

	checkCustomEmojis: {
		post: (server_name, num) => `${num} emojis added to ${server_name}!`,
		emojiPost: emoji => `:${emoji}:\n(\`${emoji}\`) #AddCustomEmojis`,
		postOnce: (server_name, num, text) => `${num} emojis added to ${server_name}!\n${text} #AddCustomEmojis`,
		emojiOnce: emoji => `:${emoji}:(\`${emoji}\`)`,
		nothing: 'I checked the emojis but it seems like none have been added.',
	},

	aichat: {
		nothing: type => `Ah... It seems that the API key for ${type} is not registered.`,
		error: type => `Ugh... It looks like an error occurred with ${type}. Maybe it will work with gemini-flash?`,
		post: (text, type) => `${text} (${type}) #aichat`,
	},

	sleepReport: {
		report: hours => `Hmm, I guess I slept for about ${hours} hours.`,
		reportUtatane: 'Hmm... I was dozing off.',
	},

	noting: {
		notes: [
			'Surprised to be dead',
			"Too bad Hiei's not here. We could use his Jagan eye to find himself.",
			'Oh my, a perfect ending for a perfect day!',
			"I'm a foreign exchange student. My English very choppy.",
			"Now I understand what kind of person you are; it's in my guidebook! Rather than be scared or surprised, you yell a lot and tell me I don't know what I'm talking about.",
			"Here's my impression of Yusuke: 'Look at me, I'm burning!",
			"They can't hear words unless they're asleep, but you can communicate feelings to living people when they're on the same emotional wavelength.",
			"It's called a Psychic Spy Glass. Look through it and you can see through walls, clothes, well, anything really.",
			'I think bone cracking is a good sign to rest.',
			'YOU just made that up! You disgusting PERVERT!',
			"Sneezy, sneezy, achoo - somebody special is thinking about you.",
			'See you soon ;)',
			'I meet so many people!  And they always seem surprised.',
			'The 𝔅𝔶𝔷𝔞𝔫𝔱𝔦𝔫𝔢 𝔑𝔢𝔵𝔲𝔰 is freedom',
			"If you're bored play some games: https://byzantinenexus.io/games",
			"Don't forget to see what's happening over in the Channels https://byzantinenexus.io/channels",
			'Antennas are a great way to follow #Hastags https://byzantinenexus.io/my/antennas',
			'ゴロゴロ…',
			'ちょっと眠いです',
			'いいですよ？',
			'(。´･ω･)?',
			'ふぇー',
			'あれ…これをこうして…あれー？',
			'ぼー…',
			'ふぅ…疲れました',
			'お味噌汁、作りましょうか？',
			'ご飯にしますか？お風呂にしますか？',
			'ふえええええ！？',
			'Da Fuuuuuuuuh!?',
			'私のサイトに、私のイラストがたくさんあって嬉しいです！',
			'みすきーって、かわいい名前ですよね！',
			'うぅ、リバーシ難しいなぁ…',
			'失敗しても、次に活かせたらプラスですよね！',
			'なんだか、おなか空いちゃいました',
			'お掃除は、定期的にしないとダメですよー？',
			'今日もお勤めご苦労様です！ 私も頑張ります♪',
			'えっと、何しようとしてたんだっけ…？',
			'おうちがいちばん、落ち着きます…',
			'疲れたら、私がなでなでってしてあげます♪',
			'離れていても、心はそばにいます♪',
			'藍ですよ〜',
			'わんちゃん可愛いです',
			'ぷろぐらむ？',
			'ごろーん…',
			'なにもしていないのに、パソコンが壊れちゃいました…',
			'Have a nice day♪',
			'お布団に食べられちゃってます',
			'寝ながら見てます',
			'念力で操作してます',
			'仮想空間から投稿してます',
			"I'm at Misskey HQ today!",
			'Misskey headquarters is located in the third sector of District Z.',
			'Misskey本部には、さーばーっていう機械がいっぱいあります',
			'しっぽはないですよ？',
			'ひゃっ…！\nネコミミ触られると、くすぐったいです',
			'抗逆コンパイル性って、なにかな？',
			'Misskeyの制服、かわいくて好きです♪',
			'ふわぁ、おふとん気持ちいいです...',
			'Do you think a maid outfit would suit me?',
			'挨拶ができる人間は開発もできる！…って、syuiloさんが言ってました',
			'ふえぇ、ご主人様どこ見てるんですか？',
			'私を覗くとき、私もまたご主人様を覗いています',
			'はい、ママですよ〜',
			'くぅ～ん...',
			'All your note are belong to me!',
			'せっかくだから、私はこの赤の扉を選びます！',
			'よしっ',
			'( ˘ω˘)ｽﾔｧ',
			'(｀・ω・´)ｼｬｷｰﾝ',
			'失礼、かみまみた',
			'おはようからおやすみまで、あなたの藍ですよ〜',
			'Misskey開発者の朝は遅いらしいです',
			'の、のじゃ...',
			'にゃんにゃんお！',
			'上から来ます！気をつけてください！',
			"It's coming from above! Be careful!",
			'ふわぁ...',
			'あぅ',
			'ふみゃ〜',
			'ふぁ… ねむねむですー',
			'ヾ(๑╹◡╹)ﾉ"',
			'私の"インスタンス"を周囲に展開して分身するのが特技です！\n人数分のエネルギー消費があるので、4人くらいが限界ですけど',
			'うとうと...',
			'ふわー、メモリが五臓六腑に染み渡ります…',
			'i pwned you!',
			'ひょこっ',
			'にゃん♪',
			'(*>ω<*)',
			'にこー♪',
			'ぷくー',
			'にゃふぅ',
			'藍が来ましたよ～',
			'じー',
			'はにゃ？',
		],
		want: item => `${item}、I want one...`,
		see: item => `While I was out walking, I saw ${item} lying on the road!`,
		expire: item => `I just realized that the expiration date of ${item} has passed...`,
	},
};

export function getSerif(variant: string | string[]): string {
	if (Array.isArray(variant)) {
		return variant[Math.floor(Math.random() * variant.length)];
	} else {
		return variant;
	}
}
