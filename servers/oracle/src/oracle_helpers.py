import logging

from oracle.src import oracle_settings


def log_setup():
    xlogger = logging.getLogger("exchange_price")
    fn = oracle_settings.ORACLE_MONITOR_LOG_EXCHANGE_PRICE
    if not fn in ("",):
        fh = logging.FileHandler(fn)
    fh.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    xlogger.addHandler(fh)

    xlogger = logging.getLogger("published_price")
    fn = oracle_settings.ORACLE_MONITOR_LOG_PUBLISHED_PRICE
    if not fn in ("",):
        fh = logging.FileHandler(fn)
    fh.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    xlogger.addHandler(fh)



