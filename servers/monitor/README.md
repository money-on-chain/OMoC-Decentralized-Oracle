# CoinFabrik Monitor
[ToC]

## Monitor

Monitor main purpose is notify and display about defined state alerts. Those states are:

 * oracle process is not running
 * there is no balance of native coin, required for oracle's gas consumtion
 * oracle haven't published price in a defined period of time
 
Alerts will be sent via email when they are triggered and can also be check all the time in 
the web interface.

 
### Requirements

 * supervisor
 * python3.7  (or later versions)
 * python3.7-dev  (for module cytool/web3py..)
 * python3.7-pip

### Installation

There are two common ways to install this: with or without python's virtual-env.

Using virtual-env is analogous to using a new system user and installing requirements into users' space by doing the following:

1. Review supervisor configuration files and modify them to support oracle execution: backend/supervisor/*.conf
    * install them into `/etc/supervisor/conf.d`
    * make supervisor accessible:
        * edit /etc/supervisor/supervisor.conf to include:
            `[inet_http_server]`
            `port = 127.0.0.1:9001`
    * `supervisorctl add oracle`
    * `supervisorctl start oracle` being oracle the process
    * Also note that `supervisorctl restart oracle` will restart components and make them reload the configuration.
1. Install sources in two places one for the agent and one for the backend:
    * `git clone repository-link cfmonitor/`
1. Install python project dependencies: `python3.7 -m pip install --user -r  cfmonitor/backend/requirements.txt`
1. Create full configuration based on `Sample.env` (see details in the section below):
    * `cd backend`
    * `vim .env`  edit the configuration file according to the network and your deployment
1. You can manually run (in case you want to diagnose or test) the agent and the backend by doing the what is described below:
    * `cd backend && python3.7 main.py`


### Configuration

The `.env` configuration file is required by both components.

Here is a configuration sample followed by the parameters description:

```
BC_NODE=https://public-node.testnet.rsk.co
BC_NETID=31
AGENT_PROGRAM=oracle
ORACLE_MGR=0x.....  
ORACLE_ADDRESS=0x695706Df94DB0970c1AD41e84a5c2bdB24C6C618
GAS_LOW_LIMIT=1.4
PAIRS=BTCUSD,RIFBTC
ACCOUNTS=account_name1, account_name2,..
account_name1=0x695706Df94DB0970c1AD41e84a5c2bdB24C6C618
account_name2=0x695706Df94DB0970c1AD41e84a5c2bdB24C6C618
..

NO_PUB_PERIOD_ALERT=600

SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=465
SMTP_From=someone <someone@yahoo.com>
SMTP_SSL_TLS=yes
SMTP_USER=someone@yahoo.com
SMTP_PWD=gmaqwgfkqgzpkied

ALERT_EMAILS=to-be-notified@example.com
EMAIL_REPEAT_INTERVAL=3600
DEBUG=true
```

**BC_NODE**=node to connect to.
**BC_NETID**=net id from network at node.
**AGENT_PROGRAM**=the program-name to check on supervisor
**ORACLE_ADDRESS**=address to check for last price publication
**PAIRS**=check price publication for these coinpairs
**GAS_LOW_LIMIT**=ethers limit. below this will raise alert
**ACCOUNTS**=the list of accounts to check for gas (eg: account_name_1, account_name_2,..)
**account_name_1**=0x....
**account_name_2**=0x....
**NO_PUB_PERIOD_ALERT**=time limit without price publications, after that, alert will be raised

**SMTP_HOST**=smtp server address used to deliver reports.
**SMTP_PORT**=smtp server port.
**SMTP_From**=Email sender <email address>
**SMTP_SSL_TLS**=yes if smtp server requires SSL/TLS connection, else no

**ALERT_EMAILS**=email addresses to notify to.
**EMAIL_REPEAT_INTERVAL**=time interval (in seconds) required to re-send a recurring alert message.

**ALERT_LOG_FILENAME**=where to store the log of every alert.

**DEBUG**=turn this value to True if you want logs to be extra-verbose.

##### Optional Parameters (when server requires authentication):

**SMTP_USER**=user for authentication.
**SMTP_PWD**=password for authentication.


(*) All addresses **must** be ethereum checksummed. 
You can use [etherscan indexer webpage](https://etherscan.io/address/address-to-checksum) to get the mentioned checksum.

### Alerts

Currently defined alerts. New rules can be easily added in `alerts.py` file.


#### User action is expected:
<dl>
  <dt>Agent-alive</dt>
  <dd>indicates the current status of the oracle process.</dd>
</dl>

<dl>
  <dt>gas: account</dt>
  <dd>checks the native coin balance of the oracle. this is required to send transactions when it is required for the oracle to operate. The threshold is setup in .env configuration: <em>ALERT_GAS_MIN</em>.</dd>

</dl>

#### No user action expected:
<dl>
  <dt>no-publication: pair</dt>
  <dd>indicates there was no publication since defined time period</dd>
</dl>


### Considerations

When alarms are triggered, emails configured are notified. As the alarms state usually don't go off fast, there is a setting to indicate which is the *time interval* required to notify for the same alarms. However, this interval is ignored if a new alarm occurs.


*Supervisor*: both components are expected to be running continuously without crashes. Nevertheless, we rely on supervisor to:
 * keep them running all the time
 * monitor its state

The *backend* doesn't yet include options to configure interface and port where to bind. Indeed by default listens on address: 127.0.0.1, port: 7777. We recommend at least change the listening address to: 127.0.0.1 as we recommend to access it through a reverse-proxy.
