#pm2 del all
#rm -rf ~/.pm2/dump.pm2
pm2 del Oracle
. ./delfos/address.sh
Instances=${#Addr[@]} pm2 start ecosystem.config.js
#pm2 save
