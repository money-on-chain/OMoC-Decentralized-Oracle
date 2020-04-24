import asyncio
import copy
import logging
import time
from datetime import datetime

from config import Config
from mailer import MailQueue
from slack import SlackQueue


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
        if self.notify_by_email:
            self.mq = MailQueue(Config.Get().getAlertEmails())
        if self.notify_by_slack:
            self.sq = SlackQueue()

    @classmethod
    def Setup(cls, config):
        if not cls.Configured:
            cls.Configured = True
            cls.notify_by_email = (config.getSMTP() is not None
                                   and config.getSMTP()[0] is not None)
            cls.notify_by_slack = config.getSlackInfo() is not None
            al = logging.getLogger("alarms")
            h = logging.FileHandler(config.getLogAlarmFilename())
            h.setFormatter(logging.Formatter(config.getLogFormat()))
            al.addHandler(h)

    async def test(self, ctx):
        """ returns a new state composed by alert"""
        new_state = {alert_name for alert_name in self.a_names if self.alerts[alert_name].test(ctx)}
        self.prevState, self.currentOn = self.currentOn, new_state
        return new_state

    async def do_notify(self, ctx):
        if self.update_required():
            asyncio.create_task(self.log_alerts(ctx, self.currentOn, self.prevMsgState))
            data = {"date": datetime.now(),
                    "alerts": [(new_or_old, alert.msg(ctx), alert.action_required) for (new_or_old, alert)
                               in self.iter_alerts(self.currentOn, self.prevMsgState)]}
            if self.notify_by_email:
                await self.send_email(data)
            if self.notify_by_slack:
                await self.send_slack(data)
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

    async def send_email(self, data):
        try:
            self.mq.push(data)
        except Exception as err:
            logging.error(err)

    async def send_slack(self, data):
        try:
            self.sq.push(data)
        except Exception as err:
            logging.error(err)

    def currentAlertList(self, ctx):
        x = [{"name": alert_name,
              "msg": self.alerts[alert_name].msg(ctx),
              "manual": self.alerts[alert_name].action_required} for alert_name in self.currentOn]
        return x
