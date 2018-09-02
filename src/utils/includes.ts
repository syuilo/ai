import { hiraganaToKatagana, hankakuToZenkaku } from './japanese';

export default function(text: string, words: string[]): boolean {
	if (text == null) return false;

	text = hankakuToZenkaku(hiraganaToKatagana(text));
	words = words.map(word => hiraganaToKatagana(word));

	return words.some(word => text.includes(word));
}
