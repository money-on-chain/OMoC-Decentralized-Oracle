from getpass import getpass
from pathlib import Path
from eth_account import Account
from datetime import datetime
import re, os, requests


envMonitor = "monitor/backend/.env"
envServer = "servers/.env"
oracleDone = ""
emailDone = ""
class AccountLocal(object):
    address = ""
    privateKey = ""
    """Generete a privateKey/AccountLocal using  2 random numbers + date + an input words"""
    def __init__(self, word=""):
        super(AccountLocal, self).__init__()
        if (word != ""):
            now = datetime.now()
            randomFromWeb = requests.get('https://www.random.org/integers/?num=1&min=1&max=4096&col=1&base=10&format=plain&rnd=new').text
            seed_str =  str(randomFromWeb 
                         + str(os.urandom(4096))
                         + now.strftime("%d/%m/%Y %H:%M:%S")
                         + word)
            acct =  Account.create(seed_str)
            self.address = acct.address
            self.privateKey = acct.privateKey.hex()
    def setAddress(self,_address):
        self.address=_address
    def setPrivateKey(self,_privateKey):
        self.privateKey=_privateKey
    """ Generate an interface to get user's address and return an instance of Account"""
    @staticmethod
    def getAccount(_purpose):
        answer =""
        while (answer not in ("1","2")):
            print("Do you have a privateKey and Address or you want to generate the pair?")
            print("1. I have a PrivateKey and Address")
            print("2. I want to generate the pair")
            answer = input()
            if (answer == "1"):
                account = AccountLocal()
                print("Enter the address of the " + _purpose +" wallet in RSK")
                account.setAddress(input("Adress:")) 
                print("Enter the private password that correspond to the address you just entered")
                account.setPrivateKey(getpass("PrivateKey:"))
            elif(answer == "2" ):
                words =""
                while len(words.split()) < 2:
                    print("Enter 2 or more words separated by spaces.")
                    print("We will use them as part of the seed used for generate a random privateKey")
                    words = input()
                account = AccountLocal(words)
                print("Your new address is: " + account.address)
        return (account)

def addTo(filePath, search, addText):
    file = Path(filePath)
    content = re.sub(re.escape(search) + r'.*',search + addText,file.read_text())
    file.open('w').write(content)
def oracleOption():
    global envMonitor
    global envServer

    oracle = AccountLocal.getAccount("oracle")
    answ = input("You want to use the same address for the scheduler? (Yes/No) (default: Yes)").lower()
    if (answ in ["no","n"]):
        scheduler = AccountLocal.getAccount("scheduler")
    else:
        scheduler = AccountLocal()
        scheduler.setAddress(oracle.address)
        scheduler.setPrivateKey(oracle.privateKey)

    addTo(envServer,"ORACLE_ADDR=",'"' + oracle.address + '"')
    addTo(envServer,"ORACLE_PRIVATE_KEY=",'"' + oracle.privateKey + '"' )
    addTo(envServer,"SCHEDULER_SIGNING_ADDR = ",'"' + scheduler.address  + '"')
    addTo(envServer,"SCHEDULER_SIGNING_KEY = ", '"' + scheduler.privateKey + '"')
    addTo(envMonitor,"ORACLE_SERVER_ADDRESS=",oracle.address)
def emailOption():
    global envMonitor
    print("///////////")
    print("Now we will setup your SMTP email configuration. ")
    print("///////////")

    #user input
    smtp_host  = input("SMTP_HOST:")
    smtp_port = input("SMTP_PORT:")
    answ = input("Does the SMTP account require using TLS? (Yes/No) (default: Yes)").lower()
    if answ in ["no","n"]:
        SMTP_SSL_TLS = "no"
    else:
        SMTP_SSL_TLS= "yes"
    SMTP_user = input("SMTP user:")
    SMTP_pass = getpass("SMTP password:")
    emailFrom = input("From:")
    print("What email account will receive the messages?")
    emailTo = input("to:")
    print("How often, in seconds, are the emails sent?")
    seconds = input("seconds: ")
    #setup file
    addTo(envMonitor,"SMTP_HOST=", smtp_host)
    addTo(envMonitor,"SMTP_PORT=", smtp_port)
    addTo(envMonitor,"SMTP_SSL_TLS=", SMTP_SSL_TLS)
    addTo(envMonitor,"SMTP_USER=", SMTP_user)
    addTo(envMonitor,"SMTP_PWD=", SMTP_pass)
    addTo(envMonitor,"SMTP_From=", emailFrom)
    addTo(envMonitor,"ALERT_EMAILS=", emailTo)
    addTo(envMonitor,"EMAIL_REPEAT_INTERVAL=", seconds)
def checkStatus():
    global envMonitor
    global oracleDone
    global emailDone 
    oracleDone = ""
    emailDone = ""
    file = Path(envMonitor)
    oracle = re.search('ORACLE_SERVER_ADDRESS=.*',file.read_text())
    mail = re.search('SMTP_HOST=.*',file.read_text())
    if (oracle.group().strip() != "ORACLE_SERVER_ADDRESS="): oracleDone = " (Done)"
    if (mail.group().strip() != "SMTP_HOST=" ): emailDone = " (Done)"
def main():
    global envMonitor
    global envServer
    global oracleDone
    global emailDone

    folders = os.getcwd().split("/")
    if ((folders[len(folders)-1] ) == "scripts"):
        envMonitor = "../" + envMonitor
        envServer = "../" + envServer
    
    # Address  and privateKey
    print("///////////")
    print("We are going to configure your oracle. ")
    print("For this we will require an address and its respective privateKey to the RSK network. ")
    print("As well as an SMTP user and an email to notify about error messages.")
    print("An important thing to keep in mind is that you will need to have RBTC in this `oracle` account to pay for the system gas.")
    print("Please, enter the information that will be requested below.")
    print("Note: Private data (private keys and passwords) given by the user will not be displayed on the console")
    print("///////////")
    print("")

    quit = False
    while (quit ==False):
        checkStatus()

        print("Please, select what do you want to configure right now:")
        print(" 1. Configure my oracle and scheduler" + oracleDone)
        print(" 2. Configure my email account" + emailDone)
        print(" 3. I have done the two previous items. What are the following instructions?")
        print(" 4. Exit")
        Menu = input()
        if (Menu == "4" ): quit = True
        if (Menu == "1"): oracleOption()
        if (Menu == "2"): emailOption()
        if (Menu == "3"): 
            print("")
            print("////////")
            print("if everything is setup correctly, let's run the services.")
            print("Run the following commands:")
            print(" ")
            print("sudo systemctl enable supervisor.service")
            print("sudo supervisord")
            print("supervisorctl status")
            print(" ")
            print("////////")
            quit = True
if __name__ == "__main__":
    main()
