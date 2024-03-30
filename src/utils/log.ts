import chalk from 'chalk';

export default function(msg: string) {
	console.log(createMessage(msg));
}

export function warn(msg: string) {
	console.warn(createMessage(msg));
}

function createMessage(msg: string) {
	const now = new Date();
	const date = `${zeroPad(now.getHours())}:${zeroPad(now.getMinutes())}:${zeroPad(now.getSeconds())}`;
	return `${chalk.gray(date)} ${msg}`;
}

function zeroPad(num: number, length: number = 2): string {
	return ('0000000000' + num).slice(-length);
}
