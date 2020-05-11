from getpass import getpass
from pathlib import Path
import re

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
	print("A continuacion vamos a configurar su oraculo. ")
	print("Para ello vamos a requerir un address y su privateKey respectivo a la red de RSK. ")
	print("Asi como un usuario SMTP y un mail al cual avisar por los mensajes de error.")
	print("Recuerde que para que el sistema funcione tal address debe de poseer RSK.")
	print("Por favor, ingrese la informacion que se le solicitará a continuación.")
	print("Aclaración: los datos privados (llaves privadas y contraseñas) no se visualizarán en la consola")
	print("///////////")
	

	address = input("address:") 
	privKey = getpass("PrivateKey:") 

	answ = input("Desea usar la misma direccion para el scheduler? (Si/no) (default: Si)").lower()
	if (answ in ["no","n"]):
		print("¿que dirección va a usar para el scheduler ?")
		schedulerAddress = input("address:")
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
	answ = input("¿la cuenta de SMTP requiere usar TLS? (si/no) (default: si)").lower()
	if answ in ["no","n"]:
		addTo(envMonitor,"SMTP_SSL_TLS=", "no")
	else:
		addTo(envMonitor,"SMTP_SSL_TLS=", "yes")
	addTo(envMonitor,"SMTP_USER=", input("SMTP user:"))
	addTo(envMonitor,"SMTP_PWD=", getpass("SMTP password:"))
	addTo(envMonitor,"ALERT_EMAILS=", input("¿que cuenta de mail recibirá los mensajes?"))
	addTo(envMonitor,"SMTP_From=", input("From:"))
	addTo(envMonitor,"EMAIL_REPEAT_INTERVAL=", input("Cada cuantos segundos se enviará el mail:"))
	#add and remove comments
	print("")
	print("////////")
	print("Perfecto, esta todo configurado.")
	print("Vamos a levantar los servicios")
	print("////////")

	supervisorctl start oracle
	supervisorctl start backend

	supervisorctl status
	print("////////")

	print("Los servicios estan corriendo.")
	print("Si desea deteer los servicios simplemente ingrese:")
	print("  supervisorctl stop oracle")
	print("  supervisorctl stop backend")
	print("////////")

	print("supervisorctl")
if __name__ =="__main__":
	main()
