#!/bin/bash

if [ $BRANCH ]; then
  # Git complains without credentials
  git config --global user.email "name@example.com"
  git config --global user.name "Example Name"
  git checkout -b $BRANCH master
  git checkout $BRANCH
  git pull git://github.com/18f/federalist.git $BRANCH
  if [ "$BRANCH" !=  "master" ]; then
    npm install --unsafe-perm
  fi
fi
npm start
