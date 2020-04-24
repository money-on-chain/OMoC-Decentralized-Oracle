import asyncio
import traceback
from datetime import datetime

from quart import Quart, render_template

import blockchain
from alert_checker import AlertChecker
from alerts import GasFor, AgentMonitorAlert
# app = FastAPI()
from moc.moc_oracle import NoPubAlert

app = Quart(__name__, static_url_path='/')
Checker = None


def TS(d):
    d.update({"ts": str(datetime.now())})
    return d


def UpdateOk(d):
    d.update({"result": "ok"})
    return TS(d)


def UpdateError(e):
    d = {"result": "error", "error": str(e)}
    return TS(d)


@app.route("/")
async def home():
    return await render_template('index.html')


@app.route("/alerts")
async def alarms():
    info = blockchain.Info.Get()
    try:
        return UpdateOk({"alerts": Checker.currentAlertList(info)})
    except Exception as e:
        traceback.print_exc()
        return UpdateError(e)


# p = os.path.join("..", "frontend", "build")
# app.mount("/", StaticFiles(directory=p), name="/")

def prepare_alerts(info):
    alerts = []
    agent = info.cfg.getAgentProgram()
    if agent == "":
        app.logger.error("No AGENT_PROGRAM specified. Alert disabled.")
    else:
        alerts.append(AgentMonitorAlert)
    for acc in info.accountCheckers.keys():
        checker = info.accountCheckers[acc]
        for pair in checker.pairs:
            alerts.append(NoPubAlert(checker, pair))
    for account in info.accounts:
        alerts.append(GasFor(account))
    return alerts


async def main_loop():
    global Checker
    info = blockchain.Info.Get()
    alerts = prepare_alerts(info)
    Checker = AlertChecker(alerts)
    while True:
        while not (await info.checkBlock()):
            await asyncio.sleep(1)
        await info.fetch()
        await Checker.test(info)
        await Checker.do_notify(info)
        await asyncio.sleep(blockchain.sleep_for_net(app))


# @app.on_event("startup")
@app.before_serving
async def startup_event():
    asyncio.create_task(main_loop())
