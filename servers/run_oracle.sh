#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
if [ -d "$DIR/venv" ]; then
  echo "activating virtualenv venv"
  . ./venv/bin/activate
fi
python -m oracle.src.main
