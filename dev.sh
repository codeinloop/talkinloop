#!/usr/bin/env bash
# Sobe o backstage e o deck juntos, com recarga automática. TALK escolhe a apresentação.
#   ./dev.sh          deck em modo dev (:3000) + backstage (:8080)
#   ./dev.sh build    builda o deck e serve pelo backstage, como na imagem Docker
#   ./dev.sh stop     libera as portas, se uma execução anterior ficou presa

set -euo pipefail
cd "$(dirname "$0")"

export TALK="${TALK:-starter}"
LIVE_PORT="${LIVE_PORT:-8080}"
DECK_PORT="${DECK_PORT:-3000}"
export DATA_DIR="${DATA_DIR:-$PWD/backstage/data}"
export PRESENTER_AUTH="${PRESENTER_AUTH:-off}"

listeners() { lsof -nP -tiTCP:"$1" -sTCP:LISTEN 2>/dev/null || true; }

if [ "${1:-}" = "stop" ]; then
  for port in "$LIVE_PORT" "$DECK_PORT"; do
    for pid in $(listeners "$port"); do
      echo "matando pid $pid na porta $port ($(ps -o comm= -p "$pid" 2>/dev/null))"
      kill "$pid" 2>/dev/null || true
    done
  done
  exit 0
fi

busy=0
for port in "$LIVE_PORT" "$DECK_PORT"; do
  for pid in $(listeners "$port"); do
    echo "porta $port já em uso por pid $pid ($(ps -o comm= -p "$pid" 2>/dev/null))"; busy=1
  done
done
if [ "$busy" = 1 ]; then
  echo "rode ./dev.sh stop para liberar, ou use LIVE_PORT=... DECK_PORT=... ./dev.sh"
  exit 1
fi

killtree() {
  local p
  for p in $(pgrep -P "$1" 2>/dev/null || true); do killtree "$p"; done
  echo "  parando $1 ($(ps -o comm= -p "$1" 2>/dev/null || echo '?'))"
  kill "$1" 2>/dev/null || true
}
pids=()
stopping=""
cleanup() {
  trap - INT TERM EXIT
  echo
  echo "encerrando..."
  for p in ${pids[@]+"${pids[@]}"}; do killtree "$p"; done
  wait 2>/dev/null || true
}
trap 'stopping=1; cleanup; exit 0' INT TERM
trap cleanup EXIT

[ -d backstage/node_modules ] || (cd backstage && npm install)
[ -d deck/node_modules ] || (cd deck && npm install)

ip=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || true)
ip="${ip:-localhost}"

if [ "${1:-}" = "build" ]; then
  (cd deck && npm run build)
  (cd backstage && PORT="$LIVE_PORT" exec node server.ts) &
  pids+=($!)
  deck_url="http://localhost:$LIVE_PORT/apresentador/1/"
else
  export NEXT_PUBLIC_LIVE_URL="${NEXT_PUBLIC_LIVE_URL:-ws://localhost:$LIVE_PORT/apresentador/ws}"
  (cd backstage && PORT="$LIVE_PORT" exec node server.ts) &
  pids+=($!)
  (cd deck && node scripts/prepare.mjs && exec node_modules/.bin/next dev -p "$DECK_PORT") &
  pids+=($!)
  deck_url="http://localhost:$DECK_PORT/apresentador/1/"
fi

echo
echo "  deck      $deck_url"
echo "  plateia   http://$ip:$LIVE_PORT/   (abra no celular, mesma rede)"
echo "  métricas  http://localhost:$LIVE_PORT/apresentador/metricas"
echo "  teclas    L robô · P votação · N notas · V vídeo · Ctrl+C encerra"
echo

# se um dos dois morrer, derruba o outro e sai (bash 3.2 do macOS não tem wait -n).
# `sleep 1 & wait` em vez de `sleep 1`: o builtin wait é interrompido pelo Ctrl+C na hora,
# enquanto um sleep em primeiro plano faria o bash engolir o sinal.
while :; do
  for p in "${pids[@]}"; do
    kill -0 "$p" 2>/dev/null || { [ -n "$stopping" ] || echo "processo $p terminou sozinho; derrubando o outro"; exit 1; }
  done
  sleep 1 & wait $! || true
done

