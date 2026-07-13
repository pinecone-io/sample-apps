#!/usr/bin/env bash
#
# Boot a server, wait until an HTTP endpoint responds, then shut it down.
# This is the reusable "drive the running app" step of the sample-apps test gate.
# Pinecone is expected to be MOCKED or GATED (dummy key) by the caller — this
# script never needs a live Pinecone connection.
#
# Usage:
#   smoke_http.sh <url> <expect> -- <command to start server...>
#     <url>     URL to poll (e.g. http://127.0.0.1:3000/)
#     <expect>  "200" to require HTTP 200, or "any" to accept any HTTP response
#               ("any" proves the process booted and is routing, even if the
#                handler errors because Pinecone is gated).
#
set -uo pipefail

URL="${1:?url required}"
EXPECT="${2:?expect required}"
shift 2
[ "${1:-}" = "--" ] && shift

echo "::group::smoke: booting server for $URL (expect=$EXPECT)"
"$@" &
PID=$!
cleanup() { kill "$PID" 2>/dev/null; wait "$PID" 2>/dev/null; }
trap cleanup EXIT

ATTEMPTS=60
for i in $(seq 1 "$ATTEMPTS"); do
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "::error::server process exited before responding"
    echo "::endgroup::"
    exit 1
  fi
  # curl prints '000' via -w on connection failure; do not append another.
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "$URL" 2>/dev/null)
  CODE=${CODE:-000}
  if [ "$CODE" != "000" ]; then
    if [ "$EXPECT" = "any" ] || [ "$CODE" = "$EXPECT" ]; then
      echo "smoke OK: $URL -> HTTP $CODE (attempt $i)"
      echo "::endgroup::"
      exit 0
    fi
    echo "  attempt $i: got HTTP $CODE, want $EXPECT — retrying"
  else
    echo "  attempt $i: no response yet — retrying"
  fi
  sleep 2
done

echo "::error::smoke FAILED: $URL never returned expected status ($EXPECT) after $ATTEMPTS attempts"
echo "::endgroup::"
exit 1
