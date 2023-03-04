#!/usr/bin/env bash

if grep keywordEnabled config.json | grep -q true; then
  if ! which mecab; then
    echo "You must install MeCab if keywordEnabled is true."
    exit 1
  fi

  if [ ! -e '/usr/lib/x86_64-linux-gnu/mecab/dic/mecab-ipadic-neologd/' ]; then
    echo "You must install mecab-ipadic-neologd if keywordEnabled is true."
    exit 1
  fi
fi

if (grep chartEnabled config.json | grep -q true) && [ ! -f ./font.ttf ]; then
  echo "You must put font.ttf if chartEnabled is true"
  exit 1
fi

node ./built
