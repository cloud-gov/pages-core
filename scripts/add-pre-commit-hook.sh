#!/bin/sh
COMMAND="yarn lint-staged"
PRECOMMIT_FILE=.git/hooks/pre-commit

if [ ! -f "$PRECOMMIT_FILE" ]; then
    echo "#!/bin/sh" > $PRECOMMIT_FILE
    chmod u+x $PRECOMMIT_FILE
fi
echo $COMMAND >> $PRECOMMIT_FILE
