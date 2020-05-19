#Setup your machine and run the service

We will setup your machine to run the Oracle and Backend services.

The Oracle service will inform the smart contracts about the current prices of the coinPairs (BTCUSD, RIFBTC).

The Backend service will send emails with the content of the logs from Oracle service to an specific email account from a SMTP email account.

If your your machine is based on the AMI from AWS, the following commands will set up your machine and start the services.


1. Configure the data of oracles and SMTP email following the instructions in the script:

	`python3 scripts/setAdress.py`

2. Enable supervisor as a service when starting the machine:

	`sudo systemctl enable supervisor.service`
3. Start supervisor:

	`sudo supervisord`
4. Check if oracle and backend service's are running:

	`supervisorctl status`

Now you can register your oracle and interact with the smartcontract using the Dapp.




