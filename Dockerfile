FROM node:0.10-onbuild

ENV BRANCH= \
  GITHUB_TOKEN= \
  GITHUB_CLIENT_ID= \
  GITHUB_CLIENT_SECRET= \
  GITHUB_CLIENT_CALLBACK_URL= \
  GITHUB_WEBHOOK_URL= \
  GITHUB_WEBHOOK_SECRET= \
  FEDERALIST_S3_BUCKET= \
  AWS_ACCESS_KEY_ID= \
  AWS_SECRET_ACCESS_KEY= \
  SAILS_LOG_LEVEL= \
  PORT=3000

RUN npm run materialize

# Set up Jekyll
RUN apt-get update && \
  apt-get install --yes ruby-full  && \
  gem install bundler && \
  bundle install

EXPOSE 3000

ENTRYPOINT ["./scripts/docker-start.sh"]
