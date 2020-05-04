import time
from collections import namedtuple
from decimal import Decimal

import config

_Alert = namedtuple("Alert", "name test msg action_required")


class Alert(_Alert):
    def render(self, ctx):
        ua = "- User action is required!!!" if self.action_required else ""
        return "  *  %s %s" % (self.msg(ctx), ua)


def convertToEther(x):
    return config.PREC_STR.format(Decimal(x) / config.ethers.factor)


C = convertToEther
FormatTime = lambda x: time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(x))
FormatPair = lambda pair: pair[:3] + "-" + pair[3:]

AgentMonitorAlert = Alert(name="agent-monitor",
                          test=lambda ctx: ctx.agentAlive != "yes",
                          msg=lambda ctx: "Agent: Agent process alive check fail. Alive status:"
                                          " %s" % ctx.agentAlive,
                          action_required=True)


def GasFor(account):
    return Alert(name="gas: " + account,
                 test=lambda ctx: ctx.balanceOf(account) <= ctx.cfg.getGasLowLimit().int,
                 msg=lambda ctx: "GasAlert: current balance in %s account (%s) is too "
                                 "low: %s < %s" % (account, ctx.accountData[account].addr,
                                                   C(ctx.balanceOf(account)),
                                                   C(ctx.cfg.getGasLowLimit().int)),
                 action_required=True)
