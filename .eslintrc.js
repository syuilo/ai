module.exports = {
	'env': {
		'es2021': true,
		'node': true,
	},
	'extends': [
		'google',
	],
	'parser': '@typescript-eslint/parser',
	'parserOptions': {
		'ecmaVersion': 'latest',
		'sourceType': 'module',
	},
	'plugins': [
		'@typescript-eslint',
	],
	'rules': {
		'no-tabs': 'off',
		'max-len': ['error', {'code': 120}],
		'indent': ['error', 'tab'],
		'@typescript-eslint/no-unused-vars': ['warn', {'argsIgnorePattern': '^_'}],
		'no-unused-vars': 'off',
		'require-jsdoc': 'off',
		'valid-jsdoc': 'off',
		'max-len': 'off',
		'no-mixed-spaces-and-tabs': 'off',
		'new-cap': 'off',
		'camelcase': 'off',
		'no-invalid-this': 'off',
		'prefer-rest-params': 'off',
	},
};
