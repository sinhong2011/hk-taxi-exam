#!/usr/bin/env bash
# Fetch official HK TD road sign images to public/signs/
# Usage: bash scripts/fetch-signs.sh
set -eo pipefail

BASE="https://www.td.gov.hk/tc/road_safety/road_users_code/index/chapter_8_the_language_of_the_road"
OUT="$(dirname "$0")/../public/signs"
INDEX="$OUT/index.json"
mkdir -p "$OUT"

PAGES=(
  "orders:signs_giving_orders_"
  "warnings:signs_giving_warning_"
  "directions:direction_signs_"
  "information:signs_giving_information_"
  "temporary:temporary_signs_"
  "markings_orders:road_markings_giving_orders_"
  "markings_warning:road_markings_giving_warning_and_information_"
)

echo "[" > "$INDEX"
FIRST=1

for pair in "${PAGES[@]}"; do
  cat="${pair%%:*}"
  slug="${pair#*:}"
  echo "→ fetching category: $cat"
  HTML=$(curl -sL "$BASE/$slug/index.html")
  IMGS=$(echo "$HTML" | grep -oE 'src="[^"]*\.(png|jpg|gif)"' | grep -oE '/filemanager/[^"]*' | sort -u)

  for path in $IMGS; do
    fname=$(basename "$path")
    url="https://www.td.gov.hk$path"
    if [ ! -f "$OUT/$fname" ]; then
      curl -sL "$url" -o "$OUT/$fname" || continue
    fi
    if [ $FIRST -eq 0 ]; then echo "," >> "$INDEX"; fi
    FIRST=0
    printf '{"category":"%s","file":"%s"}' "$cat" "$fname" >> "$INDEX"
  done
done

echo "" >> "$INDEX"
echo "]" >> "$INDEX"

count=$(ls "$OUT"/*.gif "$OUT"/*.png "$OUT"/*.jpg 2>/dev/null | wc -l | tr -d ' ')
echo "✓ done. $count signs downloaded to $OUT"
