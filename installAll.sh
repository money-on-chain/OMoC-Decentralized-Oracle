#global
echo "///////////////////"
echo "///// GLOBAL ////"
echo "///////////////////"
npm install -g ganache-cli
npm install -g truffle
npm install -g pm2
#contracts
echo "///////////////////"
echo "///// contracts ////"
echo "///////////////////"
cd contracts
npm install
cd ..

#dapp
echo "///////////////////"
echo "/////// DAPP /////"
echo "///////////////////"
cd dapp
npm install
cd ..

#servers
echo "///////////////////"
echo "///// Servers ////"
echo "///////////////////"
cd servers
cp dotenv_example .env
#apt-get install python3 python-dev python3-dev \
#     build-essential libssl-dev libffi-dev \
#     libxml2-dev libxslt1-dev zlib1g-dev \
#     python3.7-dev \
#     python-pip
pip3 install virtualenv 
virtualenv -p /usr/bin/python3.7 venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

#delfos
cd delfos
cp address.sh.example address.sh
