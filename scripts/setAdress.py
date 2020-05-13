from getpass import getpass
from pathlib import Path
import re
import os

envMonitor = "monitor/backend/.env"
envServer = "servers/.env"

def comment(filePath, search):
	file = Path(filePath)
	content = re.sub(
			r'.*' + re.escape(search) + r'.*',
			"# " + search ,
			file.read_text())
	file.open('w').write(content)
def uncomment(filePath, search):
	file = Path(filePath)
	content = re.sub(
			re.escape("#") + r'.*' + re.escape(search) + r'.*',
			search ,
			file.read_text())
	file.open('w').write(content)
def addTo(filePath, search, replace):
	file = Path(filePath)
	content = re.sub(re.escape(search) + r'.*',search + replace,file.read_text())
	file.open('w').write(content)

def main():

	# Address  and privateKey
	print("///////////")
	print("We are going to configure your oracle. ")
	print("For this we will require an address and its respective privateKey to the RSK network. ")
	print("As well as an SMTP user and an email to notify about error messages.")
	print("An important thing to keep in mind is that you will need to have RBTC in this `oracle` account to pay for the system gas.")
	print("Please, enter the information that will be requested below.")
	print("Note: Private data (private keys and passwords) will not be displayed on the console")
	print("///////////")
	z
	print("Enter the address of the oracle wallet in RSK")
	address = input("Adress:") 
	print("Enter the private password that correspond to the address you just entered")
	privKey = getpass("PrivateKey:") 

	answ = input("You want to use the same address for the scheduler? (Yes/No) (default: Yes)").lower()
	if (answ in ["no","n"]):
		print("What address will you use for the scheduler ?")
		schedulerAddress = input("Address:")
		print("Enter the private password that correspond to the address you just entered")
		schedulerPrivKey = getpass("PrivateKey:")
	else:
		schedulerAddress = address
		schedulerPrivKey = privKey

	addTo(envServer,"ORACLE_ADDR=",'"' + address + '"')
	addTo(envServer,"ORACLE_PRIVATE_KEY=",'"' + privKey + '"' )
	addTo(envServer,"SCHEDULER_SIGNING_ADDR = ",'"' + schedulerAddress  + '"')
	addTo(envServer,"SCHEDULER_SIGNING_KEY = ", '"' + schedulerPrivKey + '"')

	addTo(envMonitor,"ORACLE_SERVER_ADDRESS=",address)
	

	#EMAIL INFO



	addTo(envMonitor,"SMTP_HOST=", input("SMTP_HOST:"))
	addTo(envMonitor,"SMTP_PORT=", input("SMTP_PORT:"))
	answ = input("Does the SMTP account require using TLS? (Yes/No) (default: Yes)").lower()
	if answ in ["no","n"]:
		addTo(envMonitor,"SMTP_SSL_TLS=", "no")
	else:
		addTo(envMonitor,"SMTP_SSL_TLS=", "yes")
	addTo(envMonitor,"SMTP_USER=", input("SMTP user:"))
	addTo(envMonitor,"SMTP_PWD=", getpass("SMTP password:"))
	addTo(envMonitor,"SMTP_From=", input("From:"))
	print("What email account will receive the messages?")
	addTo(envMonitor,"ALERT_EMAILS=", input("to:"))
	print("How often, in seconds, are the emails sent?")
	addTo(envMonitor,"EMAIL_REPEAT_INTERVAL=", input("seconds:"))
	#add and remove comments
	print("")
	print("////////")
	print("Everything is setup correctly.")
	print("Let's run the services.")

	os.system("supervisorctl start oracle")
	os.system("supervisorctl start backend")

	os.system("supervisorctl status")
	print("////////")

	print("The services are running.")
	print("If you want to stop them, enter the follow commands:")
	print("  supervisorctl stop oracle")
	print("  supervisorctl stop backend")
	print("////////")

	print("supervisorctl")
if __name__ =="__main__":
	folders = os.getcwd().split("/")
	if ((folders[len(folders)-1] ) == "scripts"):
		envMonitor = "../" + envMonitor
		envServer = "../" + envServer
	main()
