#!/bin/bash

if [ "$TRAVIS_PULL_REQUEST" = "false" ]; then
  exit 0
fi;

CHANGED_FILES_LIST=`git diff-index --name-only $TRAVIS_BRANCH | grep -E '.js$|.jsx$' | tr '\n' ' '`

FAILURES=0

for FILE in $CHANGED_FILES_LIST; do
  `npm bin`/eslint $FILE
  if [ "$?" != 0 ]; then
    FAILURES=$(($FAILURES+1))
  fi
done

echo "ESLint found $FAILURES file(s) with errors"

exit $FAILURES
