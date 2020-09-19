import 藍 from '@/ai';
import { account } from '#/_mocks_/account';
import TestModule from '#/_modules_/test';
import { StreamingApi } from '#/_mocks_/ws';

process.env.NODE_ENV = 'test';

let ai: 藍;

beforeEach(() => {
  ai = new 藍(account, [
		new TestModule(),
	]);
});

test('mention hook', async () => {
	const streaming = new StreamingApi();

	
});
