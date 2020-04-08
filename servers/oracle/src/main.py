from common.run_uvicorn import run_uvicorn
from oracle.src import oracle_settings
from oracle.src.oracle_settings import ORACLE_RUN

from oracle.src.scheduler_main import run_schedulers

if __name__ == "__main__":
    if ORACLE_RUN:
        run_uvicorn("oracle.src.app:app", oracle_settings.ORACLE_PORT)
    else:
        run_schedulers()
