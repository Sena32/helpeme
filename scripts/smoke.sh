#!/usr/bin/env sh
# End-to-end smoke test through nginx (RNF-07).
#   scripts/smoke.sh               uses the default stack; stops it afterwards only if it started it.
#   SMOKE_FRESH=1 scripts/smoke.sh  uses an isolated project with empty volumes (proves boot + seed
#                                   from scratch) and removes only that project's volumes at the end.
set -eu
cd "$(dirname "$0")/.."

[ -f .env ] || { echo "Crie o .env a partir do .env.example antes do smoke." >&2; exit 1; }

if [ "${SMOKE_FRESH:-0}" = "1" ]; then
  if [ "$(docker compose ps --status running -q | wc -l | tr -d ' ')" != "0" ]; then
    echo "Pare a stack padrão (docker compose stop) antes do smoke em banco vazio: as portas são as mesmas." >&2
    exit 1
  fi
  compose="docker compose -p helpeme-smoke"
  cleanup="$compose down -v"
else
  compose="docker compose"
  was_running=$($compose ps --status running -q | wc -l | tr -d ' ')
  cleanup=$([ "$was_running" = "0" ] && echo "$compose down" || echo "true")
fi

$compose up --build -d --wait --wait-timeout 300

status=0
node --test tests/smoke/smoke.test.mjs || status=$?

$cleanup
exit "$status"
