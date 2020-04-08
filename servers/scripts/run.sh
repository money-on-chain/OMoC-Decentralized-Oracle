#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR/.."

if [ -d "./venv" ]; then
  echo "activating virtualenv venv"
  . ./venv/bin/activate
fi

if [ $# -eq 0 ]; then
  SCRIPTS=""
  for SCR in $DIR/*.py; do
    [[ -e "$SCR" ]] || break
    [[ $SCR == *"__init__"* ]] && continue
    [[ $SCR == *"settings"* ]] && continue
    filename="${SCR##*/}"
    filename_ne="${filename%%.*}"
    SCRIPTS+="$filename_ne | "
  done
  echo "Use run.sh [ $SCRIPTS ]"
fi

for i in "$@"; do
  python -m "scripts.$i"
done
