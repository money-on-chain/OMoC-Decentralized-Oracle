import asyncio
import logging
import os
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
        s = self.klass(
            host)  # https://stackoverflow.com/questions/51768041/python3-smtp-valueerror-server-hostname-cannot-be-an-empty-string-or-start-with
        s.set_debuglevel(20)
        logging.info("Sending email..")
        try:
            s.connect(host=host, port=port)
            if not (self.auth is None):
                s.login(self.auth[0], str(self.auth[1]))
            s.sendmail(self._from, dst, msg)
            s.close()
        except Exception as err:
            logging.error("Email delivery failed: %s" % err)


class MailQueue:
    def __init__(self, destination_list):
        self.dq = deque()
        asyncio.create_task(self.run())
        self.destination_list = destination_list

    def push(self, data):
        self.dq.append(data)

    def composeMsg(self, data):
        now = data["date"]
        title = "@ " + now.strftime("%c")

        msg = []
        new_present = False
        old_present = False
        user_action = False
        for new_or_old, alert_msg, alert_action_required in data["alerts"]:
            if new_or_old and not new_present:
                new_present = True
                msg.append("New alerts found:")

            if not new_or_old and not old_present:
                if new_present:
                    msg.append("")
                old_present = True
                msg.append("Alerts pending:")

            ua = "- User action is required!!!" if alert_action_required else ""
            msg.append("  *  %s %s" % (alert_msg, ua))
            user_action = user_action or alert_action_required

        ar = " - User action *REQUIRED*" if user_action else ""
        msg = ["Subject: " + title + ar, "", "Report " + title, ""] + msg
        msg.append("---")
        return os.linesep.join(msg)

    async def run(self):
        while True:
            if len(self.dq) == 0:
                await asyncio.sleep(12)
            else:
                data = self.dq.popleft()
                msg = self.composeMsg(data)
                await self.sendMsg(msg)

    async def sendMsg(self, msg):
        retry = 0
        while retry < 5:
            try:
                await EmailSender().send(self.destination_list, msg)
                return
            except Exception as err:
                logging.warning("Mail send: " + str(err))
                retry = retry + 1
        logging.error("Mail send failed: " + str(err))
