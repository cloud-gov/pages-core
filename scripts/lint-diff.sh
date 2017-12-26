#!/bin/bash

DIFF_TARGET_BRANCH="${DIFF_TARGET_BRANCH:-staging}"
echo "Linting diff against \"$DIFF_TARGET_BRANCH\" branch"

CHANGED_FILES_LIST=`git diff --name-only $DIFF_TARGET_BRANCH -- '*.js' '*.jsx' | tr '\n' ' '`

FAILURES=0

for FILE in $CHANGED_FILES_LIST; do
  `yarn bin`/eslint $FILE
  if [ "$?" != 0 ]; then
    FAILURES=$(($FAILURES+1))
  fi
done

echo "ESLint found $FAILURES file(s) with errors"

exit $FAILURES
