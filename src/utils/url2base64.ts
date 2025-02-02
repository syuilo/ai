import log from '@/utils/log.js';
import got from 'got';

export default async function(url: string): Promise<string> {
	try {
			const buffer = await got(url).buffer();
			const base64File = buffer.toString('base64');
			return base64File;
	} catch (err: unknown) {
		log('Error in url2base64');
		if (err instanceof Error) {
			log(`${err.name}\n${err.message}\n${err.stack}`);
		}
		throw err;
	}
}
