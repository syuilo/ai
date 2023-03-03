#!/usr/bin/env bash

if (grep keywordEnabled config.json | grep -q true) && (! which mecab); then
  echo "You must install MeCab if keywordEnabled is true."
  exit 1
fi

node ./built
