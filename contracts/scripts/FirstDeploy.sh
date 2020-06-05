DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
if [ "$1" == "testmode" ]; then
  echo "RUNNING IN TEST MODE"
  varfile_suffix='_test'
fi

NETWORK=ganache_deploy
if [ "$1" == "rsk_testnet" ]; then
    NETWORK="rsk_nodes"
    echo "RUNNING IN TEST MODE"
    varfile_suffix='_test'
fi
echo "Network $NETWORK"

source scripts/variables$varfile_suffix.sh

function destroy() {
    rm -rf ./build/contracts
    rm -rf ./.openzeppelin/*.json
    npx openzeppelin init MOCOraculos 1.0.0
    npx oz session --network $NETWORK --no-interactive --timeout 7500
}

if [ "$1" != "testmode" ]; then
    read -p "delete build (y/n)?" -n 1
    echo
    case "$REPLY" in
      y|Y ) echo "yes"
        destroy;;
      n|N ) echo "no";;
      * ) exit;;
    esac
else
    echo "deleting build"
    destroy;
fi

truffle migrate --network "$NETWORK" --compile-all 2>&1 | tee "$DIR/deploy.log"

mv "$DIR/deploy.log" "$DIR/../build/"
cp -r $DIR/../.openzeppelin/* "$DIR/../build/"

cp -r "$DIR/../build/contracts" "$DIR/../../dapp/src"
