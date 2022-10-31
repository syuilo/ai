FROM node:18.12.0-bullseye-slim

RUN apt-get update && apt-get install -y tini git build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

ARG enable_mecab=1

RUN if [ $enable_mecab -ne 0 ]; then apt-get update \
  && apt-get install mecab libmecab-dev mecab-ipadic-utf8 make curl xz-utils file sudo --no-install-recommends -y \
  && apt-get clean \
  && rm -rf /var/lib/apt-get/lists/* \
  && cd /opt \
  && git clone --depth 1 https://github.com/neologd/mecab-ipadic-neologd.git \
  && cd /opt/mecab-ipadic-neologd \
  && ./bin/install-mecab-ipadic-neologd -n -y \
  && rm -rf /opt/mecab-ipadic-neologd \
  && echo "dicdir = /usr/lib/x86_64-linux-gnu/mecab/dic/mecab-ipadic-neologd/" > /etc/mecabrc \
  && apt-get purge git make curl xz-utils file -y \
	&& apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/* /root/.gnupg /tmp/library-scripts; fi

COPY . /ai

WORKDIR /ai
RUN yarn install && yarn build

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD yarn start
