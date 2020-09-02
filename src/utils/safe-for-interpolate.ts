const invalidChars = [
	'@',
	'#',
	'*',
	':',
	'(',
	')',
	'[',
	']',
	' ',
	'　',
];

export function safeForInterpolate(text: string): boolean {
	return !invalidChars.some(c => text.includes(c));
}
