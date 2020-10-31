import { katakanaToHiragana, hankakuToZenkaku } from './japanese';

export default function(text: string, words: string[]): boolean {
	if (text == null) return false;

	text = katakanaToHiragana(hankakuToZenkaku(text)).toLowerCase();
	words = words.map(word => katakanaToHiragana(word).toLowerCase());

	return words.some(word => text.includes(word));
}
