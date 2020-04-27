# CoinFabrik Monitor
[ToC]

## Monitor

Monitor main purpose is notify and display alerts. Those alerts are:

 * oracle process is running or not (checked via supervisor)
 * there is no balance of native coin, required for oracle's gas consumption
 * oracle haven't published price in a defined period of time
 
Alerts will be sent via email or to a slack hook when they are triggered and can also be checked all the time in 
the web interface.

 
### Requirements

 * supervisor
 * python3.7  (or later versions)
 * python3.7-dev  (for module cytool/web3py..)
 * python3.7-pip

### Installation

Start by downloading the project from the repo: `git clone repository-link cfmonitor/`.

The monitor is configured using a `.env` file, the `Sample.env` file can be used as a base configuration.
See the details in the Configuration section.


#### Running the Monitor
        
There are two common ways to install and run the Monitor.
1. with virutal-env
2. without python's virtual-env.
 

##### With Virtualenv

Using virtual-env is the recommended way and is analogous to using a new user and installing requirements into 
users' space by doing the following:

1. Create a python virtualenv: `virtualenv -p /usr/bin/python3.7 venv`

2. Activate the virtualenv: `source venv/bin/activate`

3. Install python project dependencies: `python3.7 -m pip install --user -r  cfmonitor/backend/requirements.txt`

4. Create full configuration based on `Sample.env` (see details in the section below):
    * `cd backend`
    * `vim .env`  edit the configuration file according to the network and your deployment
    
5. You can manually run (in case you want to diagnose or test) the monitor by 
running: `cd backend && python3.7 main.py`

6. As root adjust the paths and install the supervisor file `backend/supervisor/backend.conf` in `/etc/supervisor/conf.d` 
 
7. Manage the Monitor process using supervisor: 
    * `supervisorctl add backend`
    * `supervisorctl start backend`
    * `supervisorctl stop backend`
    * `supervisorctl restart backend`
    * etc
    
##### Without Virtualenv

Installing the monitor without a virtualenv is similar to doing it with virutalenv the only difference is that
most of the commands must be run as root and affects the whole system.
As root used proceed with steps three to seven of the previous section.
    
 
### Configuration

The monitor is configured using a `.env` file that must be saved in the backend directory of the repo.
The `Sample.env` file can be used as a base configuration.

#### Configuring the block chain node.
        
To monitor the balances and oracle publication time some block chain node must be accessible. The following
configuration parameters are needed:
- `BC_NODE=node to connect to.`
- `BC_NETID=net id from network at node.`
    
For example:
- `BC_NODE=https://public-node.testnet.rsk.co`
- `BC_NETID=31`

#### Configuring block chain Oracle accounts to monitor.

To be able to monitor oracle the address of the OracleManager smart contract is needed: 
`ORACLE_MGR=0xe8E10f85D33f1343C4Fbd3c24371AcA44eb82D76` 

The following parameters determine which Oracle accounts to monitor.
For each account a name must be configured: `ACCOUNTS=account_name1, account_name2, etc`
After for each account name a variable must be add with the specific Oracle Coin Pair address for example:
- `account_name1=0x695706Df94DB0970c1AD41e84a5c2bdB24C6C618`
- `account_name2=0xff49426EE621FCF9928FfDBd163fBC13fA36f465`

The gas limit can be set using: `GAS_LOW_LIMIT=1.4`
And the no publication period alert time in seconds: `NO_PUB_PERIOD_ALERT=600`

(*) All addresses **must** be ethereum checksummed. 
You can use [etherscan indexer webpage](https://etherscan.io/address/address-to-checksum) to get the mentioned checksum.

#### Monitoring the Oracle Process

To monitor the Oracle process we use supervisor, this is optional and can be disabled
by setting an empty variable `AGENT_PROGRAM=` in the .env configuration file. 

If you choose to monitor the Oracle process the `AGENT_PROGRAM` variable must be set to `oracle` and the 
supervisor software must be configured to run it. Also supervisor must be accessible from localhost:
1. Make supervisor accessible from localhost by editing /etc/supervisor/supervisor.conf to include:
        `[inet_http_server]`
        `port = 127.0.0.1:9001`
2. To run the Oracle process using supervisor: 
    * edit the configuration file `backend/supervisor/oracle.conf` and modify it to support your specific installation 
    * as root install it into `/etc/supervisor/conf.d`
    * `supervisorctl add oracle`
    * `supervisorctl start oracle` being oracle the process
    * Also note that `supervisorctl restart oracle` will restart components and make them reload the configuration.


#### Reporting Configuration 

The monitor can report alerts via email, slack and/or using a regular log file. 

##### Log file configuration

Use the `ALERT_LOG_FILENAME` variable to set where to store the log of every alert.
To disable just set an empty name.

##### Email configuration

Use the following variables to configure email reporting:

- `SMTP_HOST=smtp server address used to deliver reports.`
- `SMTP_PORT=smtp server port.`
- `SMTP_From=Email sender <email address>`
- `SMTP_SSL_TLS=yes if smtp server requires SSL/TLS connection, else no`
- `ALERT_EMAILS=email addresses to notify to.`
- `EMAIL_REPEAT_INTERVAL=time interval (in seconds) required to re-send a recurring alert message.`

If the server requires authentication:

- `SMTP_USER=user for authentication.`
- `SMTP_PWD=password for authentication.`

If the `SMTP_HOST` variable is missing then the reporting via email is ***disabled***.

For example: 
```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=465
SMTP_From=someone <someone@yahoo.com>
SMTP_SSL_TLS=yes
SMTP_USER=someone@yahoo.com
SMTP_PWD=gmaqwgfkqgzpkied

ALERT_EMAILS=to-be-notified@example.com
EMAIL_REPEAT_INTERVAL=3600
```

##### Slack configuration

To use slack a slack application web hook must be configured in the slack website see:
`https://api.slack.com/messaging/webhooks`

Then the monitor must be configured using the following variales:

- `SLACK_HOOK_URL=https://hooks.slack.com/services/XXXXXX`
- `SLACK_HOOK_USER=monito`
- `SLACK_HOOK_CHANNEL="#moc-monit"`
- `SLACK_HOOK_TITLE=moc-monitor`

If the `SLACK_HOOK_URL` variable is missing then the reporting via slack is ***disabled***.


##### Extra parameters

- `DEBUG=turn this value to True if you want logs to be extra-verbose.`



### Alerts

New rules can be easily added in `alerts.py` file.

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
