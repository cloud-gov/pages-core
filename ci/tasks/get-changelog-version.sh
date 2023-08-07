#!/bin/bash

set -e

version=`cat .git/ref`

awk -v version=$version '/^## / { if (p) { exit }; if ($2 == version) { p=1; next } } p && NF' CHANGELOG.md > releaselog.md