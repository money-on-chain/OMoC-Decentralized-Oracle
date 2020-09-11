DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

if [ "$1" == "testmode" ]; then
  echo "RUNNING IN TEST MODE"
  varfile_suffix='_test'
fi

NETWORK=ganache_deploy
if [ "$1" == "rsk_testnet" ]; then
  NETWORK="rsk_nodes"
  echo "RUNNING IN RSK TEST MODE"
  varfile_suffix='_test'
fi
echo "Network $NETWORK"

# shellcheck source=scripts/variables.sh
source "$DIR/variables$varfile_suffix.sh"

function destroy() {
  echo "DELETE OLDER BUILD"
  rm -rf "$DIR/../build"
  rm -f "$DIR/../.openzeppelin/"*.json
  rm -f "$DIR/../.openzeppelin/.session"
}

if [ "$1" != "testmode" ]; then
  read -p "delete build (y/n)?" -n 1
  echo
  case "$REPLY" in
  y | Y)
    echo "yes"
    destroy
    ;;
  n | N) echo "no" ;;
  *) exit ;;
  esac
else
  echo "deleting build"
  destroy
fi

echo "RUN THE TRUFFLE DEPLOYMENT"
if [ "$1" != "testmode" ]; then
  npx truffle migrate --reset --network "$NETWORK" --compile-all 2>&1 | tee -a "$DIR/deploy.log"
else
  npx truffle migrate --reset --compile-all 2>&1 | tee -a "$DIR/deploy.log"
fi

echo "Store the openzepelin files in build dir"
mv "$DIR/deploy.log" "$DIR/../build/"
cp -r "$DIR/../.openzeppelin/"* "$DIR/../build/"

## Configure the dapp
if [ -d "$DIR/../../dapp" ]; then
  echo "Processing contract files for dapp"
  cd "$DIR/../../dapp" || exit
  npm run json2env
fi
