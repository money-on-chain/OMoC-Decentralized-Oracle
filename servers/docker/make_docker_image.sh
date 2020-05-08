#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

# Copio archivos necesarios del repo
cp -f  "$DIR/../requirements.txt" "$DIR/files/requirements.txt" || exit 1
cp -f -r "$DIR/../common" "$DIR/files/" || exit 1
cp -f -r "$DIR/../oracle" "$DIR/files/" || exit 1
cp -f -r "$DIR/../../contracts/build/contracts/" "$DIR/files/" || exit 1

cd "$DIR"
sudo docker build -t omoc -f Dockerfile .
