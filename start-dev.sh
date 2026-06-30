#!/usr/bin/env bash
# Persistent dev server launcher — fully detaches from the calling shell
# so the process survives after the Bash tool command returns.
cd /home/z/my-project
rm -f dev.log
exec </dev/null >/dev/null 2>&1
node /home/z/my-project/node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
echo $! > /home/z/my-project/dev.pid
