#!/bin/bash
while true; do
  if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
    pkill -9 -f "next-server" 2>/dev/null
    pkill -9 -f "next dev" 2>/dev/null
    pkill -9 -f "node.*next" 2>/dev/null
    sleep 2
    cd /home/z/my-project
    bun run dev >> /home/z/my-project/dev.log 2>&1 &
    disown 2>/dev/null || true
    echo "[$(date)] Watchdog: Server restarted" >> /home/z/my-project/dev.log
  fi
  sleep 10
done
