import logging

from fastapi import Form, HTTPException
from starlette.responses import RedirectResponse

from common import settings, run_uvicorn
from common.bg_task_executor import BgTaskExecutor
from common.services import coin_pair_price_service
from common.services.oracle_dao import CoinPair, PriceWithTimestamp
from oracle.src import oracle_settings, oracle_service, scheduler_oracle_loop, scheduler_supporters_loop
from oracle.src.monitor import MonitorTask
from oracle.src.oracle_helpers import log_setup
from oracle.src.oracle_loop import OracleLoop
from oracle.src.oracle_publish_message import PublishPriceParams

logger = logging.getLogger(__name__)
app = run_uvicorn.get_app("Oracle", "The moc reference oracle")

tasks = []
main_task = OracleLoop()


@app.get("/")
async def read_root():
    return RedirectResponse(url='/docs')


@app.on_event("startup")
async def startup():
    log_setup()

    (ORACLE_ADDR, ORACLE_PRIVATE_KEY) = oracle_settings.get_oracle_account()
    logger.info("=== Money-On-Chain Reference Oracle Starting up ===")
    logger.info("    Address: " + ORACLE_ADDR)
    logger.info("    Loop main task interval: " + str(oracle_settings.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL))
    logger.info("    Loop per-coin task interval: " + str(oracle_settings.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL))
    logger.info("    Loop blockchain loop interval: " + str(oracle_settings.ORACLE_BLOCKCHAIN_INFO_INTERVAL))

    logger.info("    Price variation-reject delta: " + str(oracle_settings.ORACLE_PRICE_REJECT_DELTA_PCT) + "%")
    tasks.append(main_task)
    if oracle_settings.ORACLE_MONITOR:
        tasks.append(MonitorTask())
    if oracle_settings.SCHEDULER_RUN_ORACLE_SCHEDULER:
        tasks.append(BgTaskExecutor(scheduler_oracle_loop.scheduler_loop))
    if oracle_settings.SCHEDULER_RUN_SUPPORTERS_SCHEDULER:
        tasks.append(BgTaskExecutor(scheduler_supporters_loop.scheduler_loop))
    for t in tasks:
        t.start_bg_task()


@app.on_event("shutdown")
def shutdown_event():
    for t in tasks:
        t.stop_bg_task()


@app.post("/sign/")
async def sign(*, version: str = Form(...),
               coin_pair: str = Form(...),
               price: str = Form(...),
               price_timestamp: str = Form(...),
               oracle_addr: str = Form(...),
               last_pub_block: str = Form(...),
               signature: str = Form(...)):
    try:
        params = PublishPriceParams(int(version), CoinPair(coin_pair),
                                    PriceWithTimestamp(int(price),
                                                       float(price_timestamp)),
                                    oracle_addr,
                                    int(last_pub_block))

        validation_data = await main_task.get_validation_data(params)
        if not validation_data:
            raise Exception("Missing coinpair %r" % coin_pair)

        logger.debug("Sign: %r" % (params,))
        message, signature = validation_data.validate_and_sign(signature)
        return {
            "message": message,
            "signature": signature.hex()
        }

    except Exception as e:
        logger.error(e)
        msg = str(e) if not settings.DEBUG else "Invalid signature"
        raise HTTPException(status_code=500, detail=msg)


if settings.DEBUG or settings.DEBUG_ENDPOINTS:
    @app.get("/get_oracle/{idx}")
    async def _get_oracle_info(idx: int):
        _info = coin_pair_price_service.get_oracle_info_by_index(idx)
        return {"oracle_info": _info}


    @app.get("/get_oracle_by_address/{address}")
    async def _get_oracle_info_by_addr(address):
        # oracle = cfg.W3.eth.contract(address=cfg.W3.toChecksumAddress(ORACLE), abi=ORACLE_ABI)
        _info = coin_pair_price_service.get_oracle_info(address)
        return {"oracle_info": {'addr': address, **_info}}


    @app.get("/get_oracle_all")
    async def _get_oracle_all():
        oracles = await oracle_service.get_all_oracles_info()
        return {"oracles": oracles}
