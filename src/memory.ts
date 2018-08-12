// 藍の記憶

import * as loki from 'lokijs';

const db = new loki('ai');

export default db;

export const contexts = db.addCollection<{
	isMessage: boolean;
	noteId?: string;
	userId?: string;
	module: string;
	key: string;
}>('contexts', {
	indices: ['key']
});
