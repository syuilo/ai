import {isNil} from 'lodash';
import ENDPOINTS from '@/constants/ENDPOINTS.js';
import GPT3_MODELS from '@/constants/GPT3_MODELS.js';
import config from '@/config';

const COMPLETION_ENDPOINT = `${ENDPOINTS.OPEN_AI}/completions`;

// 0~1
const TEMPERATURE = 0.9;
// 2048 or 4000
const MAX_TOKENS = 4000;

/**
 * @see https://beta.openai.com/docs/api-reference/completions/create
 */
async function fetchChatGPT({prompt}: {prompt: string}): Promise<string> {
	if (isNil(config.openAiApiKey)) {
		return '利用する準備ができていないようです...?';
	}
	const options = {
		model: GPT3_MODELS.davinci,
		max_tokens: MAX_TOKENS,
		temperature: TEMPERATURE,
		prompt,
	};

	const response = await fetch(COMPLETION_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${config.openAiApiKey}`,
		},
		body: JSON.stringify(options),
	});

	const results = await response.json();
	// results.choicesの中からランダムに返す
	const randomIndex = Math.floor(Math.random() * results.choices.length);
	return results.choices[randomIndex].text;
}

export default fetchChatGPT;
