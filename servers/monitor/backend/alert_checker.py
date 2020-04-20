import asyncio
import copy
import logging
import os
import time
from datetime import datetime

from config import Config
from mailer import MailQueue


class AlertChecker:
    Configured = False

    @staticmethod
    def GetAlert(AlertSet, alert_name):
        for alert in AlertSet:
            if alert.name == alert_name:
                return alert
        logging.debug("Alert '%s' not found!" % alert_name)

    def __init__(self, alerts_to_check=()):
        self.__class__.Setup(Config.Get())
        self.alerts = {a.name: a for a in alerts_to_check}
        self.a_names = [a.name for a in alerts_to_check]
        self.currentOn = set()
        self.prevState = set()
        self.prevMsgState = set()
        self.lastMsgTime = None
        self.mq = MailQueue()

    @classmethod
    def Setup(cls, config):
        if not cls.Configured:
            cls.Configured = True
            al = logging.getLogger("alarms")
            h = logging.FileHandler(config.getLogAlarmFilename())
            h.setFormatter(logging.Formatter(config.getLogFormat()))
            al.addHandler(h)

    async def test(self, ctx):
        """ returns a new state composed by alert"""
        new_state = {alert_name for alert_name in self.a_names if self.alerts[alert_name].test(ctx)}
        self.prevState, self.currentOn = self.currentOn, new_state
        return new_state

    async def do_email(self, ctx):
        if self.update_required():
            asyncio.create_task(self.log_alerts(ctx, self.currentOn, self.prevMsgState))
            await self.send(ctx, self.currentOn, self.prevMsgState)
            self.lastMsgTime = time.time()
            self.prevMsgState = self.currentOn

    def update_required(self):
        if len(self.currentOn) == 0:
            return False
        new_alerts = self.currentOn - self.prevMsgState
        if len(new_alerts) > 0:
            return True
        if self.lastMsgTime is None:
            return True
        return time.time() - self.lastMsgTime > Config.Get().LastMailInterval

    def iter_alerts(self, currentst, prevst):
        current = copy.copy(currentst)
        new_alerts = current - prevst
        current = current - new_alerts
        for new_or_old, alerts in [(True, new_alerts), (False, current)]:
            for alert_name in alerts:
                yield new_or_old, self.alerts[alert_name]

    async def log_alerts(self, ctx, currentst, prevst):
        logger = logging.getLogger("alarms")
        for new_or_old, alert in self.iter_alerts(currentst, prevst):
            f = logger.error if new_or_old else logger.warning
            f(alert.render(ctx))

    async def send(self, ctx, currentst, prevst):
        try:
            msg = self.composeMsg(ctx, currentst, prevst)
            self.mq.push(msg)
        except Exception as err:
            logging.error(err)

    def currentAlertList(self, ctx):
        x= [{"name": alert_name,
             "msg": self.alerts[alert_name].msg(ctx),
             "manual": self.alerts[alert_name].action_required} for alert_name in self.currentOn]
        return x

    def composeMsg(self, ctx, currentst, prevst):
        now = datetime.now()
        title = "@ " + now.strftime("%c")

        msg = []
        new_present = False
        old_present = False
        user_action = False
        for new_or_old, alert in self.iter_alerts(currentst, prevst):
            if new_or_old and not new_present:
                new_present = True
                msg.append("New alerts found:")

            if not new_or_old and not old_present:
                if new_present:
                    msg.append("")
                old_present = True
                msg.append("Alerts pending:")
            msg.append(alert.render(ctx))
            user_action = user_action or alert.action_required

        ar = " - User action *REQUIRED*" if user_action else ""
        msg = ["Subject: " + title + ar, "", "Report " + title, ""]+msg
        msg.append("---")
        return os.linesep.join(msg)
