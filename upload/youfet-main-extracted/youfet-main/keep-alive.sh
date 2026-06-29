#!/bin/bash
# Auto-restart Next.js dev server if not running
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null | grep -q "200"; then
  pkill -9 -f "next-server" 2>/dev/null
  pkill -9 -f "next dev" 2>/dev/null  
  sleep 1
  cd /home/z/my-project
  bun run dev > /home/z/my-project/dev.log 2>&1 &
  disown 2>/dev/null || true
  echo "$(date): Server restarted" >> /home/z/my-project/dev.log
fi
