FROM node:10

RUN apt-get update && apt-get install -y git

RUN mkdir -p /app

WORKDIR /app
ADD . /app

RUN yarn config set cache-folder /app/.yarn-cache

EXPOSE 1337 8888
