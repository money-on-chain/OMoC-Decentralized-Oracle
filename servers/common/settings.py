import os
import pathlib

from starlette.config import Config
from starlette.datastructures import URL

from common.helpers import parseTimeDelta

config = Config(".env")

# Block chain network id
NETWORK_ID = config('NETWORK_ID', cast=int)
# Block chain server url
NODE_URL = config('NODE_URL', cast=URL)
# Block chain chain id
CHAIN_ID = config('CHAIN_ID', cast=str, default=None)
CONTRACT_ROOT_FOLDER = config('CONTRACT_ROOT_FOLDER', cast=pathlib.Path,
                              default=os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                                   "../../contracts"))
# The server expect to find in this folder the *.json files with the abi an addresses of contracts
CONTRACT_FOLDER = config('CONTRACT_FOLDER', cast=pathlib.Path,
                         default=os.path.join(CONTRACT_ROOT_FOLDER, "build/contracts"))

# Timeout used when connection to the blockchain node
WEB3_TIMEOUT = parseTimeDelta(config('WEB3_TIMEOUT ', cast=str, default="30 secs"))

# Turn on debug?
UVICOIN_DEBUG = config('UVICOIN_DEBUG', cast=bool, default=False)
DEBUG = config('DEBUG', cast=bool, default=False)
LOG_LEVEL = config('LOG_LEVEL', cast=str, default="info")
# Add some development endpoints
DEBUG_ENDPOINTS = config('DEBUG_ENDPOINTS', cast=bool, default=False)
# Reload on source code change, used for development
RELOAD = config('RELOAD', cast=bool, default=False)
# Print stack trace of errors, used for development
ON_ERROR_PRINT_STACK_TRACE = config('ON_ERROR_PRINT_STACK_TRACE', cast=bool, default=False)
# Swagger app version
VERSION = config('VERSION', cast=str, default="1.0.0")
