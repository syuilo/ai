import { hiraganaToKatagana, hankakuToZenkaku } from './japanese';

export default function(text: string, words: string[]): boolean {
	if (text == null) return false;

	text = cleanup(hankakuToZenkaku(hiraganaToKatagana(text)));
	words = words.map(word => hiraganaToKatagana(word));

	return words.some(word => text == word);
}

function cleanup(text: string): string {
	return text.trim()
		.replace(/[！!]+$/, '')
		.replace(/。$/, '')
		.replace(/デス$/, '')
		.replace(/^藍/, '')
		.replace(/^チャン/, '')
		.replace(/、+$/, '');
}
