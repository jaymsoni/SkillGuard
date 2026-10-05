#!/usr/bin/env bash
# dummy script
input="$1"
if [ -z "$input" ]; then echo "missing"; exit 1; fi
node -e "console.log(new Date('$input').toISOString())"
