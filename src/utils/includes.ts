import { katakanaToHiragana, hankakuToZenkaku } from './japanese';

export default function(text: string, words: string[]): boolean {
	if (text == null) return false;

	text = katakanaToHiragana(hankakuToZenkaku(text));
	words = words.map(word => katakanaToHiragana(word));

	return words.some(word => text.includes(word));
}
