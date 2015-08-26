FROM node:0.10-onbuild

# Expose environment variables
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

# Run additional npm install scripts
RUN npm run install --unsafe-perm

# Set up Jekyll
RUN apt-get update && \
  apt-get install --yes ruby-full  && \
  gem install bundler && \
  bundle install

# Make internal port available to host
EXPOSE 3000

# Start script
ENTRYPOINT ["./scripts/docker-start.sh"]
