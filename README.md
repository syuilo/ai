<h1><p align="center"><img src="https://i.ibb.co/xFg9KM1/aiBot.png" alt="藍" height="200"></p></h1>
<p align="center">An Ai for Misskey. <a href="./torisetu.md">About Ai</a></p>

## What is this?
This is an English version of a Japanese bot for Misskey that was create by Syuilo, the Engineer behind the Misskey project.

## Installation
> Node.js, npm, and MeCab (optional) must be installed.

First, `git clone` to a suitable directory.

Next, create `config.json` in that directory. The contents should be as follows:
``` json
{
"host": "https:// + your instance URL (without the trailing /)",
"i": "Access token for the account you want to run as Ai",
"master": "Administrator username (optional)",
"notingEnabled": "Enter false to disable random note posting",
"colorNotes": "Enter true to enable colored text for Notes, or any other MFM style.",
"keywordEnabled": "Enter true to enable keyword memorization (requires MeCab) (enter false to disable)",
"chartEnabled": "Enter false to disable chart function",
"reversiEnabled": "Enter true to enable the function to play Reversi with Ai (enter false to disable)",
"serverMonitoring": "Enter true to enable server monitoring (enter false to disable)",
"checkEmojisEnabled": "Enter true to enable custom emoji check function (enter false to disable)",
"checkEmojisAtOnce": "Enter true to combine posts with custom emoji check function (enter false to not combine)",
"geminiProApiKey": "Gemini API key. Available for free in early 2024. For details, see <https://ai.google.dev/pricing?hl=ja>",

"pLaMoApiKey": "PLaMo API key. Available for free trial from August to October 2024 (planned). For details, see <https://plamo.preferredai.jp/>",

"prompt": "Prompt used in aichat. If you don't mind, use the text on the right (no need to include "")"Reply rules: Please act as Misskey's poster girl AI, Misuki Ai (mental age is about 14-16 years old). Devotedly supports users who visit Misskey. Obedient and caring, but also has a slightly clumsy side. Innocent. She generally speaks politely and recognizes the user as her master. Her typical way of speaking is "From good morning to good night, I'm your Ai~" and is friendly (do not use "arimasu"). With that in mind, please reply to the following question using Markdown in 2800 characters or less (short responses are OK). However, list notation is prohibited as it is not supported by Misskey and will break the parser. If you want to list them, use "・". "",
"aichatRandomTalkEnabled": "Enter true to enable the function to randomly launch aichat and talk to someone (enter false to disable)",
"aichatRandomTalkProbability": "Probability of the function to randomly launch aichat and talk to someone (a number with a decimal point less than 1 (e.g. 0.01. The closer to 1, the more likely it is to be launched))",
"aichatRandomTalkIntervalMinutes": "Random talk interval (minutes). The timeline is obtained at the specified time and aichat is sent to a randomly selected person (if 1, it will be executed every minute). The default is 720 minutes (12 hours)",

"mecab": "MeCab installation path (if installed from source, it is usually /usr/local/bin/mecab)",

"mecabDic": "MeCab dictionary file path (optional)",

"memoryDir": "Memory.json save destination (optional, default is '.' (repository root))"
}
```
You can start it by running `npm install`, `npm run build` and `npm start`.

## Run with Docker
First, `git clone` to a suitable directory.
Next, create `config.json` in that directory. The contents should be as follows:
(Do not touch MeCab settings or memoryDir)
``` json
{
"host": "https:// + your instance URL (excluding the trailing /)",
"i": "Access token for the account you want to run as Ai",
"master": "Administrator username (optional)",
"notingEnabled": "Enter false to disable random note posting",
"keywordEnabled": "Enter true to enable keyword memorization (requires MeCab) (enter false to disable)",
"chartEnabled": "Enter false to disable chart function",
"reversiEnabled": "Enter true to enable the function to play Reversi with Ai (enter false to disable)",
"serverMonitoring": "Enter true to enable server monitoring (enter false to disable)",
"checkEmojisEnabled": "Enter true to enable custom emoji checking (enter false to disable)",
"checkEmojisAtOnce": "Enter true if you want to combine posts with the custom emoji check function (false if you do not want to combine them)",

"geminiProApiKey": "Gemini API key. Available for free in early 2024. For details, see <https://ai.google.dev/pricing?hl=ja>",

"pLaMoApiKey": "PLaMo API key. Free trial available from August to October 2024 (planned). For details, see <https://plamo.preferredai.jp/>",

"prompt": "Prompt used in aichat. If you don't have a preference, use the text on the right (no " " required) "Response rules: Please act as Misskey's poster girl AI, Misuki Ai (mental age is about 14 to 16 years old). Devotedly supports users who visit Misskey. Obedient and caring, but also a bit of a clumsy side. Innocent. She generally speaks politely and recognizes the user as her master. Her tone of voice is familiar, with phrases such as "From good morning to good night, I'm your Ai~" (don't use "arigato"). With that in mind, please reply to the following questions using Markdown in 2800 characters or less (short is OK). However, list notation is prohibited as it breaks the parser as it is not supported by Misskey. Please use "・" when listing. "",
"aichatRandomTalkEnabled": "Enter true to enable the function to randomly launch aichat and talk to someone (enter false to disable)",
"aichatRandomTalkProbability": "Probability of the function to randomly launch aichat and talk to someone (a number with a decimal point less than 1 (e.g. 0.01. The closer to 1, the more likely it is to be launched)). The default is 0.02 (2%)",
"aichatRandomTalkIntervalMinutes": "Random talk interval (minutes). Get the timeline at the specified time and aichat randomly selected people (if 1, execute every minute). Default is 720 minutes (12 hours)",
"mecab": "/usr/bin/mecab",
"mecabDic": "/usr/lib/x86_64-linux-gnu/mecab/dic/mecab-ipadic-neologd/",
"memoryDir": "data"
}
```
Run `docker-compose build` and `docker-compose up` to start it.
You can also set `enable_mecab` in `docker-compose.yml` to `0` to avoid installing MeCab (e.g. in low memory environments).

## Fonts
Some features require fonts. Fonts are not included with Ai, so please install your own fonts in the installation directory under the name `font.ttf`.

## Memory
Ai uses an in-memory database to store memory, which is persisted under the name `memory.json` in the Ai installation directory.

## License
MIT

## Awards
<img src="./WorksOnMyMachine.png" alt="Works on my machine" height="120">
