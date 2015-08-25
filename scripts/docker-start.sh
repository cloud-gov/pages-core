#!/bin/bash

if [ $BRANCH ]; then
  git checkout -b $BRANCH master
  git checkout $BRANCH
  git pull https://github.com/18f/federalist.git $BRANCH
  if [ "$BRANCH" !=  "master" ]; then
    npm update
  fi
fi
npm start
