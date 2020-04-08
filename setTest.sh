echo "////////////////////////////////"
echo "Clear old values"
echo "////////////////////////////////"
pm2 uninstall pm2-logrotate
pm2 del all


echo "////////////////////////////////"
echo "run ganache"
echo "////////////////////////////////"

pm2 start contracts/run_ganache.sh --name ganache --namespace Ganache

echo "////////////////////////////////"
echo "run contracts & register oracles"
echo "////////////////////////////////"
cd ./contracts
./scripts/FirstDeploy.sh testmode
truffle exec scripts/register_test_servers.js
cd ..


#run pm2 Delfos
echo "////////////////////////////////"
echo "Run Delfos"
echo "////////////////////////////////"
cd ./servers
./run_delfos.sh

echo "////////////////////////////////"
echo "continue mining"
echo "////////////////////////////////"
pm2 start continueMining.sh --namespace Ganache
cd ..



echo "////////////////////////////////"
echo "setup & Run dapp"
echo "////////////////////////////////"

cp -r ./contracts/build/contracts ./dapp/src
cd dapp

echo "" > .env.development
echo "REACT_APP_AllowMint=true" >>.env.development
echo "REACT_APP_NetworkID=12341234" >> .env.development
echo "REACT_APP_RefreshTime=1000" >> .env.development

node tools/json2env.js >> .env.development


cd dapp
pm2 start npm --name dapp --namespace dapp -- start 

echo "////////////////////////////////"
echo "install pm2-logrotate"
echo "////////////////////////////////"

pm2 install pm2-logrotate

