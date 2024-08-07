#!/bin/bash
set -e

# https://unix.stackexchange.com/questions/181937/how-create-a-temporary-file-in-shell-script
tmpfile=$(mktemp)
exec 3>"$tmpfile"
exec 4<"$tmpfile"
rm "$tmpfile"

git log --format='%ae %ai %h' | head -n 800 >&3

while IFS= read -r line <&4
do
#   echo "Line: $line"
  commit=$(echo "$line" | awk '{ print $5 }')
  git -c advice.detachedHead=false checkout $commit &> /dev/null
  # shellcheck disable=SC2038
  yaml=$(find . -type d -name node_modules -prune -o -name '*.yml' -print | xargs wc -l | tail -n 1 | awk '{ print $1}')
  echo "$line" | awk -F',' -v yaml=$yaml '{ print $1, $2, $5, yaml}'
done
