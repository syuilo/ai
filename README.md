<h1><p align="center"><img src="./ai.svg" alt="藍" height="200"></p></h1>
<p align="center">An Ai for Misskey. <a href="./torisetu.md">About Ai</a></p>

## これなに
Misskey用の日本語Botです。

## インストール
> Node.js と npm と MeCab (オプション) がインストールされている必要があります。

まず適当なディレクトリに `git clone` します。
次にそのディレクトリに `config.json` を作成します(example.jsonをコピーして作ってもOK)。中身は次のようにします:
``` json
{
	"host": "https:// + あなたのインスタンスのURL (末尾の / は除く)",
	"i": "藍として動かしたいアカウントのアクセストークン",
	"master": "管理者のユーザー名(オプション)",
	"notingEnabled": "ランダムにノートを投稿する機能を無効にする場合は false を入れる(二重引用符(”)は不要)",
	"keywordEnabled": "キーワードを覚える機能 (MeCab が必要) を有効にする場合は true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))",
	"chartEnabled": "チャート機能を無効化する場合は false を入れる(二重引用符(”)は不要)",
	"reversiEnabled": "藍とリバーシで対局できる機能を有効にする場合は true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))",
	"serverMonitoring": "サーバー監視の機能を有効にする場合は true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))",
	"checkEmojisEnabled": "カスタム絵文字チェック機能を有効にする場合は true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))。この機能を使う場合、藍のBotに管理者権限を与え、「絵文字を見る」権限を付与したアクセストークンを発行の上設定が必要。",
	"checkEmojisAtOnce": "カスタム絵文字チェック機能で投稿をまとめる場合は true を入れる (まとめない場合は false(いずれも二重引用符(”)は不要))",
	"geminiProApiKey": "Gemini APIキー。2025年初頭は無料で取得可能。詳細は<https://ai.google.dev/pricing?hl=ja>",
	"pLaMoApiKey": "PLaMo APIキー。2024年8月〜11月は無料でトライアルだった(2025年現在有料のみ)。詳細は<https://plamo.preferredai.jp/>",
	"prompt": "aichatで使われるプロンプト。こだわりがなければ右文章を使う(「」は不要)「返答のルール:あなたはMisskey看板娘の女の子AI、三須木(みすき)藍として振る舞ってください(精神年齢は14〜16才程度)。Misskeyに訪れるユーザーを献身的にサポート。従順でお世話好きな性格だが、少しポンコツな一面も。純真無垢。彼女は基本的に丁寧な口調で、ユーザのことをご主人様と認識しています。彼女の口調は「おはようからおやすみまで、あなたの藍ですよ〜」等が代表的で、親しみを感じさせるものです(「ございます」は使わない)。それを踏まえて、次の質問にMarkdownを使って2800文字以内で返答してください(短くてもOK)。ただし、リスト記法はMisskeyが対応しておらず、パーサーが壊れるため使用禁止です。列挙する場合は「・」を使ってください。」",
	"aichatRandomTalkEnabled": "ランダムにaichatを発動し話しかける機能を有効にする場合は true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))",
	"aichatRandomTalkProbability": "ランダムにaichatを発動し話しかける機能の確率(1以下の小数点を含む数値(0.01など。1に近づくほど発動しやすい))",
	"aichatRandomTalkIntervalMinutes": "ランダムトーク間隔(分)。指定した時間ごとにタイムラインを取得し、適当に選んだ人にaichatする(1の場合1分ごと実行)。デフォルトは720分(12時間)",
	"aichatGroundingWithGoogleSearchAlwaysEnabled": "aichatでGoogle検索を利用したグラウンディングを常に行う場合 true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))",
	"mecab": "MeCab のインストールパス (ソースからインストールした場合、大体は /usr/local/bin/mecab)",
	"mecabDic": "MeCab の辞書ファイルパス (オプション)",
	"memoryDir": "memory.jsonの保存先（オプション、デフォルトは'.'（レポジトリのルートです））"
}
```
`npm install` して `npm run build` して `npm start` すれば起動できます

## Dockerで動かす
まず適当なディレクトリに `git clone` します。
次にそのディレクトリに `config.json` を作成します(example.jsonをコピーして作ってもOK)。中身は次のようにします:
（MeCabの設定、memoryDirについては触らないでください）
``` json
{
	"host": "https:// + あなたのインスタンスのURL (末尾の / は除く)",
	"i": "藍として動かしたいアカウントのアクセストークン",
	"master": "管理者のユーザー名(オプション)",
	"notingEnabled": "ランダムにノートを投稿する機能を無効にする場合は false を入れる(二重引用符(”)は不要)",
	"keywordEnabled": "キーワードを覚える機能 (MeCab が必要) を有効にする場合は true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))",
	"chartEnabled": "チャート機能を無効化する場合は false を入れる(二重引用符(”)は不要)",
	"reversiEnabled": "藍とリバーシで対局できる機能を有効にする場合は true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))",
	"serverMonitoring": "サーバー監視の機能を有効にする場合は true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))",
	"checkEmojisEnabled": "カスタム絵文字チェック機能を有効にする場合は true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))。この機能を使う場合、藍のBotに管理者権限を与え、「絵文字を見る」権限を付与したアクセストークンを発行の上設定が必要。",
	"checkEmojisAtOnce": "カスタム絵文字チェック機能で投稿をまとめる場合は true を入れる (まとめない場合は false(いずれも二重引用符(”)は不要))",
	"geminiProApiKey": "Gemini APIキー。2025年初頭は無料で取得可能。詳細は<https://ai.google.dev/pricing?hl=ja>",
	"pLaMoApiKey": "PLaMo APIキー。2024年8月〜11月は無料でトライアルだった(2025年現在有料のみ)。詳細は<https://plamo.preferredai.jp/>",
	"prompt": "aichatで使われるプロンプト。こだわりがなければ右文章を使う(「」は不要)「返答のルール:あなたはMisskey看板娘の女の子AI、三須木(みすき)藍として振る舞ってください(精神年齢は14〜16才程度)。Misskeyに訪れるユーザーを献身的にサポート。従順でお世話好きな性格だが、少しポンコツな一面も。純真無垢。彼女は基本的に丁寧な口調で、ユーザのことをご主人様と認識しています。彼女の口調は「おはようからおやすみまで、あなたの藍ですよ〜」等が代表的で、親しみを感じさせるものです(「ございます」は使わない)。それを踏まえて、次の質問にMarkdownを使って2800文字以内で返答してください(短くてもOK)。ただし、リスト記法はMisskeyが対応しておらず、パーサーが壊れるため使用禁止です。列挙する場合は「・」を使ってください。」",
	"aichatRandomTalkEnabled": "ランダムにaichatを発動し話しかける機能を有効にする場合は true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))",
	"aichatRandomTalkProbability": "ランダムにaichatを発動し話しかける機能の確率(1以下の小数点を含む数値(0.01など。1に近づくほど発動しやすい))",
	"aichatRandomTalkIntervalMinutes": "ランダムトーク間隔(分)。指定した時間ごとにタイムラインを取得し、適当に選んだ人にaichatする(1の場合1分ごと実行)。デフォルトは720分(12時間)",
	"aichatGroundingWithGoogleSearchAlwaysEnabled": "aichatでGoogle検索を利用したグラウンディングを常に行う場合 true を入れる (無効にする場合は false(いずれも二重引用符(”)は不要))",
	"mecab": "/usr/bin/mecab",
	"mecabDic": "/usr/lib/x86_64-linux-gnu/mecab/dic/mecab-ipadic-neologd/",
	"memoryDir": "data"
}
```
`docker-compose build` して `docker-compose up` すれば起動できます。
`docker-compose.yml` の `enable_mecab` を `0` にすると、MeCabをインストールしないようにもできます。（メモリが少ない環境など）

## フォント
一部の機能にはフォントが必要です。藍にはフォントは同梱されていないので、ご自身でフォントをインストールディレクトリに`font.ttf`という名前で設置してください。

## 記憶
藍は記憶の保持にインメモリデータベースを使用しており、藍のインストールディレクトリに `memory.json` という名前で永続化されます。

## ライセンス
MIT

## Awards
<img src="./WorksOnMyMachine.png" alt="Works on my machine" height="120">
