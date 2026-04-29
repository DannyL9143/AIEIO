#!/bin/sh
set -eu

SOURCE_DIR="/app/default-data"
TARGET_DIR="/app/data"

mkdir -p "${TARGET_DIR}/CORSAIR" "${TARGET_DIR}/GlobalMaritime" "${TARGET_DIR}/users" "${TARGET_DIR}/evaluations"

copy_if_missing() {
  src="$1"
  dst="$2"
  if [ ! -f "$dst" ] && [ -f "$src" ]; then
    cp "$src" "$dst"
    echo "copied:$(basename "$dst")"
  else
    echo "present:$(basename "$dst")"
  fi
}

copy_if_missing "${SOURCE_DIR}/CORSAIR/corsair_pirate_attacks.csv" "${TARGET_DIR}/CORSAIR/corsair_pirate_attacks.csv"
copy_if_missing "${SOURCE_DIR}/GlobalMaritime/global_maritime_pirate_attacks.csv" "${TARGET_DIR}/GlobalMaritime/global_maritime_pirate_attacks.csv"
copy_if_missing "${SOURCE_DIR}/users/users.json" "${TARGET_DIR}/users/users.json"
copy_if_missing "${SOURCE_DIR}/users/credentials.json" "${TARGET_DIR}/users/credentials.json"
