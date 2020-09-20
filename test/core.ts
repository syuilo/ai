import 藍 from '@/ai';
import { account } from '#/__mocks__/account';
import TestModule from '#/__modules__/test';
import { StreamingApi } from '#/__mocks__/ws';

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
