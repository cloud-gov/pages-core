FROM buildpack-deps:stretch-curl

RUN apt-get update && \
    apt-get install apt-transport-https -y && \
    wget -q -O - https://packages.cloudfoundry.org/debian/cli.cloudfoundry.org.key | apt-key add - && \
    echo "deb https://packages.cloudfoundry.org/debian stable main" | tee /etc/apt/sources.list.d/cloudfoundry-cli.list && \
    apt-get update && \
    apt-get install cf-cli postgresql postgresql-client python python-pip jq awscli -y

WORKDIR /app

COPY migrate-site-bucket.sh .

RUN chmod +x migrate-site-bucket.sh
