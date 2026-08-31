#!/usr/bin/env bash
# Keeps the LendStream dev server up on :5176.
#
# The harness-managed preview server does not survive between sessions, so this
# supervises `npm run dev` directly: if the port stops answering it restarts the
# server, then keeps watching. Fully detached — it outlives the terminal that
# started it.
#
#   start:  nohup bash scripts/keep-alive.sh > /dev/null 2>&1 &
#   stop:   bash scripts/keep-alive.sh stop
#   status: bash scripts/keep-alive.sh status

set -uo pipefail

APP_DIR="/Users/mac/AI focus/lendstream-dsa-hub"
PORT=5176
URL="http://localhost:$PORT/login"
LOG="$APP_DIR/.keepalive/dev.log"
SUP_PID="$APP_DIR/.keepalive/supervisor.pid"
CHECK_EVERY=15

mkdir -p "$APP_DIR/.keepalive"

port_up() { curl -s -o /dev/null --max-time 8 "$URL" 2>/dev/null; }

case "${1:-run}" in
  stop)
    if [ -f "$SUP_PID" ]; then
      kill "$(cat "$SUP_PID")" 2>/dev/null && echo "supervisor stopped"
      rm -f "$SUP_PID"
    else
      echo "no supervisor pid file"
    fi
    # Take the dev server down with it, otherwise it is orphaned.
    pkill -f "next dev.*$PORT" 2>/dev/null
    lsof -ti tcp:$PORT 2>/dev/null | xargs kill 2>/dev/null
    echo "port $PORT released"
    exit 0
    ;;
  status)
    if [ -f "$SUP_PID" ] && kill -0 "$(cat "$SUP_PID")" 2>/dev/null; then
      echo "supervisor: running (pid $(cat "$SUP_PID"))"
    else
      echo "supervisor: not running"
    fi
    if port_up; then echo "server: UP on $PORT"; else echo "server: DOWN"; fi
    exit 0
    ;;
esac

echo $$ > "$SUP_PID"
cd "$APP_DIR" || exit 1

restarts=0
while true; do
  if ! port_up; then
    # Clear anything half-dead holding the port before rebinding.
    lsof -ti tcp:$PORT 2>/dev/null | xargs kill -9 2>/dev/null
    sleep 1
    echo "[$(date '+%F %T')] starting dev server (restart #$restarts)" >> "$LOG"
    nohup npm run dev >> "$LOG" 2>&1 &
    restarts=$((restarts + 1))
    # Next builds are slow to first response; give it room before re-checking.
    sleep 25
  fi
  sleep "$CHECK_EVERY"
done
