#!/usr/bin/env bash
# Підбирає, який заголовок приймає ваш MCP-ендпоїнт.
# Ключ у чат не потрапляє — читається з .dst.env і ніде не друкується.
#
#   bash probe-auth.sh

set -uo pipefail
DIR="$(dirname "$0")"
ENVFILE="$DIR/.dst.env"

[ -f "$ENVFILE" ] || { echo "Немає $ENVFILE — покладіть туди LOCAL_SERVICE_KEY=..."; exit 1; }
# shellcheck disable=SC1090
set -a; . "$ENVFILE"; set +a
: "${LOCAL_SERVICE_KEY:?У .dst.env немає LOCAL_SERVICE_KEY}"

URL="${VPS_SUPABASE_URL}/mcp?features=database%2Cdebugging%2Cdevelopment%2Cdocs"
BODY='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}'

try() {
  local label="$1"; shift
  local code
  code=$(curl -sS --max-time 20 -o "$DIR/.probe-out" -w '%{http_code}' \
    -X POST "$URL" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    "$@" -d "$BODY" 2>/dev/null)
  printf '%-34s http=%s  %s\n' "$label" "$code" "$(head -c 120 "$DIR/.probe-out" | tr -d '\n')"
}

echo "Перевіряю варіанти заголовків:"
try "Authorization: Bearer"  -H "Authorization: Bearer $LOCAL_SERVICE_KEY"
try "apikey"                 -H "apikey: $LOCAL_SERVICE_KEY"
try "apikey + Authorization" -H "apikey: $LOCAL_SERVICE_KEY" -H "Authorization: Bearer $LOCAL_SERVICE_KEY"
try "x-api-key"              -H "x-api-key: $LOCAL_SERVICE_KEY"

rm -f "$DIR/.probe-out"
echo
echo "Той рядок, де http=200 — той заголовок і треба в .mcp.json"
