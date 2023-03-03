#!/usr/bin/env bash

if (! which mecab) && (grep keywordEnabled config.json | grep -q true); then
  echo "You must install MeCab if keywordEnabled is true."
  exit 1
fi

node ./built
