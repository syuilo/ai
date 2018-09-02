import { hiraganaToKatagana, hankakuToZenkaku } from './japanese';

export default function(text: string, words: string[]): boolean {
	if (text == null) return false;

	text = hankakuToZenkaku(hiraganaToKatagana(text));
	words = words.map(word => hiraganaToKatagana(word));

	return words.some(word => {
		/**
		 * テキストの余分な部分を取り除く
		 * 例えば「藍ちゃん好き！」のようなテキストを「好き」にする
		 */
		function cleanup(text: string): string {
			return text.trim()
				.replace(/[！!]+$/, '')
				// 末尾の ー を除去
				// 例えば「おはよー」を「おはよ」にする
				// ただそのままだと「セーラー」などの本来「ー」が含まれているワードも「ー」が除去され
				// 「セーラ」になり、「セーラー」を期待している場合はマッチしなくなり期待する動作にならなくなるので、
				// 期待するワードの末尾にもともと「ー」が含まれている場合は(対象のテキストの「ー」をすべて除去した後に)「ー」を付けてあげる
				.replace(/ー+$/, '') + (word[word.length - 1] == 'ー' ? 'ー' : '')
				.replace(/ッ+$/, '')
				.replace(/。$/, '')
				.replace(/デス$/, '')
				.replace(/^藍/, '')
				.replace(/^チャン/, '')
				.replace(/、+$/, '');
		}

		return (text == word) || (cleanup(text) == word);
	});
}

