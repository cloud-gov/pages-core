#!/usr/bin/env bash
awslocal s3api create-bucket --bucket build-logs

# how should we link this to the site factories in create-dev-data
for i in {1..6}
do
   awslocal s3api create-bucket --bucket website-bucket-$i
done

