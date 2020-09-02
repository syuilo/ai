// Utilities for Japanese

const kanaMap: string[][] = [
	['ガ', 'ｶﾞ'], ['ギ', 'ｷﾞ'], ['グ', 'ｸﾞ'], ['ゲ', 'ｹﾞ'], ['ゴ', 'ｺﾞ'],
	['ザ', 'ｻﾞ'], ['ジ', 'ｼﾞ'], ['ズ', 'ｽﾞ'], ['ゼ', 'ｾﾞ'], ['ゾ', 'ｿﾞ'],
	['ダ', 'ﾀﾞ'], ['ヂ', 'ﾁﾞ'], ['ヅ', 'ﾂﾞ'], ['デ', 'ﾃﾞ'], ['ド', 'ﾄﾞ'],
	['バ', 'ﾊﾞ'], ['ビ', 'ﾋﾞ'], ['ブ', 'ﾌﾞ'], ['ベ', 'ﾍﾞ'], ['ボ', 'ﾎﾞ'],
	['パ', 'ﾊﾟ'], ['ピ', 'ﾋﾟ'], ['プ', 'ﾌﾟ'], ['ペ', 'ﾍﾟ'], ['ポ', 'ﾎﾟ'],
	['ヴ', 'ｳﾞ'], ['ヷ', 'ﾜﾞ'], ['ヺ', 'ｦﾞ'],
	['ア', 'ｱ'], ['イ', 'ｲ'], ['ウ', 'ｳ'], ['エ', 'ｴ'], ['オ', 'ｵ'],
	['カ', 'ｶ'], ['キ', 'ｷ'], ['ク', 'ｸ'], ['ケ', 'ｹ'], ['コ', 'ｺ'],
	['サ', 'ｻ'], ['シ', 'ｼ'], ['ス', 'ｽ'], ['セ', 'ｾ'], ['ソ', 'ｿ'],
	['タ', 'ﾀ'], ['チ', 'ﾁ'], ['ツ', 'ﾂ'], ['テ', 'ﾃ'], ['ト', 'ﾄ'],
	['ナ', 'ﾅ'], ['ニ', 'ﾆ'], ['ヌ', 'ﾇ'], ['ネ', 'ﾈ'], ['ノ', 'ﾉ'],
	['ハ', 'ﾊ'], ['ヒ', 'ﾋ'], ['フ', 'ﾌ'], ['ヘ', 'ﾍ'], ['ホ', 'ﾎ'],
	['マ', 'ﾏ'], ['ミ', 'ﾐ'], ['ム', 'ﾑ'], ['メ', 'ﾒ'], ['モ', 'ﾓ'],
	['ヤ', 'ﾔ'], ['ユ', 'ﾕ'], ['ヨ', 'ﾖ'],
	['ラ', 'ﾗ'], ['リ', 'ﾘ'], ['ル', 'ﾙ'], ['レ', 'ﾚ'], ['ロ', 'ﾛ'],
	['ワ', 'ﾜ'], ['ヲ', 'ｦ'], ['ン', 'ﾝ'],
	['ァ', 'ｧ'], ['ィ', 'ｨ'], ['ゥ', 'ｩ'], ['ェ', 'ｪ'], ['ォ', 'ｫ'],
	['ッ', 'ｯ'], ['ャ', 'ｬ'], ['ュ', 'ｭ'], ['ョ', 'ｮ'],
	['ー', 'ｰ']
];

/**
 * カタカナをひらがなに変換します
 * @param str カタカナ
 * @returns ひらがな
 */
export function katakanaToHiragana(str: string): string {
	return str.replace(/[\u30a1-\u30f6]/g, match => {
		const char = match.charCodeAt(0) - 0x60;
		return String.fromCharCode(char);
	});
}

/**
 * ひらがなをカタカナに変換します
 * @param str ひらがな
 * @returns カタカナ
 */
export function hiraganaToKatagana(str: string): string {
	return str.replace(/[\u3041-\u3096]/g, match => {
		const char = match.charCodeAt(0) + 0x60;
		return String.fromCharCode(char);
	});
}

/**
 * 全角カタカナを半角カタカナに変換します
 * @param str 全角カタカナ
 * @returns 半角カタカナ
 */
export function zenkakuToHankaku(str: string): string {
	const reg = new RegExp('(' + kanaMap.map(x => x[0]).join('|') + ')', 'g');

	return str
		.replace(reg, match =>
			kanaMap.find(x => x[0] == match)![1]
		)
		.replace(/゛/g, 'ﾞ')
		.replace(/゜/g, 'ﾟ');
};

/**
 * 半角カタカナを全角カタカナに変換します
 * @param str 半角カタカナ
 * @returns 全角カタカナ
 */
export function hankakuToZenkaku(str: string): string {
	const reg = new RegExp('(' + kanaMap.map(x => x[1]).join('|') + ')', 'g');

	return str
		.replace(reg, match =>
			kanaMap.find(x => x[1] == match)![0]
		)
		.replace(/ﾞ/g, '゛')
		.replace(/ﾟ/g, '゜');
};
