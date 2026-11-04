#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
production="$(sed -n 's/^  Content-Security-Policy: //p' "$root/public/_headers")"
dev="$(sed -n "s/^    add_header Content-Security-Policy \"\(.*\)\" always;$/\1/p" "$root/docker/dev.conf")"
expected="$(printf '%s' "$production" | sed -e 's| https://api.betterreadsapp.com||g' -e 's| https://static.cloudflareinsights.com||g' -e 's| https://cloudflareinsights.com||g' -e 's|; upgrade-insecure-requests||')"

if [ "$dev" = "$expected" ]; then
  echo "ok - should match the production CSP after the dev removals"
else
  echo "not ok - should match the production CSP after the dev removals"
  echo "expected: $expected"
  echo "actual:   $dev"
  exit 1
fi
