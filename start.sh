#!/usr/bin/env bash

if (grep keywordEnabled config.json | grep -q true) && (! which mecab) && [ ! -e '/usr/lib/x86_64-linux-gnu/mecab/dic/mecab-ipadic-neologd/' ]; then
  echo "You must install MeCab and mecab-ipadic-neologd if keywordEnabled is true."
  exit 1
fi

node ./built
