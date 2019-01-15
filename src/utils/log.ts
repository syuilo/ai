import chalk from 'chalk';

export default function(msg: string) {
	const now = new Date();
	const date = `${zeroPad(now.getHours())}:${zeroPad(now.getMinutes())}:${zeroPad(now.getSeconds())}`;
	console.log(`${chalk.gray(date)} ${msg}`);
}

function zeroPad(num: number, length: number = 2): string {
	return ('0000000000' + num).slice(-length);
}
