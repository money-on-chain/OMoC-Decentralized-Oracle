import asyncio
import logging
from collections import deque
from smtplib import SMTP, SMTP_SSL
from config import Config


class EmailSender:
    def __init__(self):
        config = self.config = Config.Get()
        use_ssl = config.getSMTP_UseSSL()
        self.smtp_con = config.getSMTP()
        self.auth = config.getSMTP_AUTH()
        self._from = config.getSMTP_From()
        self.klass = SMTP_SSL if use_ssl else SMTP

    async def send(self, dst, msg):
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, lambda: self._send(dst, msg))

    def _send(self, dst, msg):
        host, port = self.smtp_con
        s = self.klass(host)  # https://stackoverflow.com/questions/51768041/python3-smtp-valueerror-server-hostname-cannot-be-an-empty-string-or-start-with
        s.set_debuglevel(20)
        logging.info("Sending email..")
        try:
            s.connect(host=host, port=port)
            if not(self.auth is None):
                s.login(self.auth[0], str(self.auth[1]))
            s.sendmail(self._from, dst, msg)
            s.close()
        except Exception as err:
            logging.error("Email delivery failed: %s"%err)


class MailQueue:
    def __init__(self):
        self.dq = deque()
        asyncio.create_task(self.run())
        self.destination_list = Config.Get().getAlertEmails()

    def push(self, msg):
        self.dq.append(msg)

    async def run(self):
        while True:
            if len(self.dq) == 0:
                await asyncio.sleep(12)
            else:
                msg = self.dq.popleft()
                await self.sendMsg(msg)

    async def sendMsg(self, msg):
        retry = 0
        while retry<5:
            try:
                await EmailSender().send(self.destination_list, msg)
                return
            except Exception as err:
                logging.warning("Mail send: "+str(err))
        logging.error("Mail send failed: "+str(err))
