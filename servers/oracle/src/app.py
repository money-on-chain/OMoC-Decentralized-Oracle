import logging

from fastapi import Form, HTTPException

from common import settings, run_uvicorn
from common.services.oracle_dao import CoinPair, PriceWithTimestamp
from oracle.src.main_executor import MainExecutor
from oracle.src.oracle_publish_message import PublishPriceParams

logger = logging.getLogger(__name__)
main_executor = MainExecutor()
app = run_uvicorn.get_app("Oracle", "The moc reference oracle")


@app.on_event("startup")
async def startup():
    main_executor.web_server_startup()


@app.on_event("shutdown")
def shutdown_event():
    main_executor.shutdown()


@app.get("/")
async def read_root():
    raise HTTPException(status_code=404, detail="Item not found")


@app.post("/sign/")
async def sign(*, version: str = Form(...),
               coin_pair: str = Form(...),
               price: str = Form(...),
               price_timestamp: str = Form(...),
               oracle_addr: str = Form(...),
               last_pub_block: str = Form(...),
               other_signature: str = Form(...)):
    try:
        params = PublishPriceParams(int(version), CoinPair(coin_pair),
                                    PriceWithTimestamp(int(price),
                                                       float(price_timestamp)),
                                    oracle_addr,
                                    int(last_pub_block))

        validation_data = await main_executor.oracle_loop.get_validation_data(params)
        if not validation_data:
            raise Exception("Missing coin pair %r" % coin_pair)

        logger.debug("Sign: %r" % (params,))
        message, my_signature = validation_data.validate_and_sign(other_signature)
        return {
            "message": message,
            "signature": my_signature.hex()
        }

    except Exception as e:
        logger.error(e)
        msg = str(e) if settings.DEBUG else "Invalid signature"
        raise HTTPException(status_code=500, detail=msg)
