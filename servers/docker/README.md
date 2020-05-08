
1. Build docker

```
./make_docker_image.sh
```

2. Run

```
sudo docker run -d \
--publish 5004:5004 \
--name some_omoc \
--network="host" \
--env NODE_URL="http://localhost:8545" \
--env NETWORK_ID=12341234 \
--env ORACLE_ADDR=0x2F560290FEF1B3Ada194b6aA9c40aa71f8e95598 \
--env ORACLE_PRIVATE_KEY=0x21d7212f3b4e5332fd465877b64926e3532653e2798a11255a46f533852dfe46 \
--env ORACLE_PORT=5004 \
omoc
```

El parámetro `--network="host"` es necesario si el nodo esta corriendo en el mismo host que el docker

