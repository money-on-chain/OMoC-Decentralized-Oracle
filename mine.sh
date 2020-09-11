#!/bin/bash
MOD=50
END=$(($1 / $MOD))
for i in $(seq 1 $END);
do 
    echo -n "$(($i * $MOD)) : "
    for j in $(seq 1 $MOD);
    do 
        echo -n "$j "
        curl -s -H "Content-Type: application/json" -X POST --data \
                '{"id":1337,"jsonrpc":"2.0","method":"evm_mine","params":[1]}' http://localhost:8545 > /dev/null &
    done 
    echo
done

REST=$(($1 % $MOD))
for i in $(seq 1 $REST);
do 
    echo -n "$i "
    curl -s -H "Content-Type: application/json" -X POST --data \
            '{"id":1337,"jsonrpc":"2.0","method":"evm_mine","params":[1]}' http://localhost:8545 > /dev/null &
done
echo
