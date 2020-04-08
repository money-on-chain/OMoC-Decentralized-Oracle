#!/bin/bash
. delfos/address.sh

echo "////////"
echo $InstanceID
echo ${Addr[$InstanceID]}
echo ${OracPort[$InstanceID]}
echo ${OracleCoinPairFilter[$InstanceID]}
echo "////////"

export ORACLE_ADDR="${Addr[$InstanceID]}"
export ORACLE_PRIVATE_KEY="${Priv[$InstanceID]}"
export SCHEDULER_SIGNING_ADDR="${Addr[$InstanceID]}"
export SCHEDULER_SIGNING_KEY="${Priv[$InstanceID]}"
export ORACLE_PORT="${OracPort[$InstanceID]}"
export ORACLE_COIN_PAIR_FILTER="${OracleCoinPairFilter[$InstanceID]}"

if [ -d "$PWD/venv" ]; then
  echo "activating virtualenv venv"
  . ./venv/bin/activate
  python -m oracle.src.main
else
  echo "fail $PWD/venv"
fi
