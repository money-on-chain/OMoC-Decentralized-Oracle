import decimal
import logging
import unittest

from web3 import HTTPProvider
from web3 import Web3

from starlette.config import Config
from starlette.datastructures import Secret, CommaSeparatedStrings

decimal.getcontext().prec = 80
PREC_STR = '{:f}'


class _decimal:
    def __init__(self, value: str):
        self._value = decimal.Decimal(value)

    def __str__(self) -> str:
        return str(self._value)


class InvalidValue(Exception):
    pass


class ethers:
    factor = decimal.Decimal(10 ** 18)

    def __init__(self, value: str):
        try:
            self._value = decimal.Decimal(value) * self.factor
        except:
            raise InvalidValue("Invalid value: %s" % value)
        self._value = int(self._value.to_integral_exact())
        if str(self) != value:
            raise InvalidValue("Invalid value: %s" % value)

    def __str__(self) -> str:
        return PREC_STR.format(self._value / self.factor)

    @property
    def int(self):
        return self._value


config = Config(".env")


class TestEthers(unittest.TestCase):
    def test_too_many_digits_but_ok(self):
        src = "0.123456789012345678"
        e = ethers(src)
        self.assertEqual(str(e), src)

    def test_too_many_digits(self):
        src = "0.1234567890123456789"
        self.assertRaises(InvalidValue, ethers, src)

    def test_nonzero_too_many_digits_but_ok(self):
        src = "123456789012345678123456789012345678.123456789012345678"
        e = ethers(src)
        self.assertEqual(str(e), src)

    def test_nonzero_too_many_digits(self):
        src = "123456789012345678123456789012345678.1234567890123456789"
        self.assertRaises(InvalidValue, ethers, src)


class Config:
    _Instance = None

    @classmethod
    def Get(cls):
        if cls._Instance is None:
            cls._Instance = cls()
        return cls._Instance

    def __init__(self):
        self.W3 = Web3(HTTPProvider(self.getNodeAddress()))

    # system
    def getW3(self):
        return self.W3

    def getBCNetId(self):
        return config("BC_NETID", cast=int)

    def getNodeAddress(self):
        return config("BC_NODE", cast=str)

    def getOracleManagerAddress(self):
        return config("ORACLE_MGR", cast=str)

    # config
    def getAgentProgram(self):
        return config("AGENT_PROGRAM", cast=str, default="oracle")

    def getAccountList(self):
        return config("ACCOUNTS", cast=CommaSeparatedStrings)

    def getAccountAddress(self, account):
        return config(account, cast=str)

    def getOracleAddresses(self):
        return config("ORACLE_ADDRESSES", cast=str)

    def getGasLowLimit(self):
        return config("GAS_LOW_LIMIT", cast=ethers)

    def getMaxNoPubPeriod(self):
        return config("NO_PUB_PERIOD_ALERT", cast=float, default=600)

    # mailer
    def getSMTP(self):
        return (config("SMTP_HOST", cast=str, default=None),
                config("SMTP_PORT", cast=int, default=25))

    def getSMTP_From(self):
        return config("SMTP_From", cast=str)

    def getSMTP_AUTH(self):
        try:
            return (config("SMTP_USER", cast=str),
                    config("SMTP_PWD", cast=Secret))
        except:
            logging.warning("No SMTP authentication data.")
            return None

    def getSMTP_UseSSL(self):
        return config("SMTP_SSL_TLS", cast=str, default="no").lower() in [
            "y", "yes", "true"]

    def getAlertEmails(self):
        return config("ALERT_EMAILS", cast=CommaSeparatedStrings)

    # global
    def getDebug(self):
        return config('DEBUG', cast=bool, default=False)

    def getLogFormat(self):
        return '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

    def getLogAlarmFilename(self):
        return config('ALERT_LOG_FILENAME', cast=str, default="alerts.txt")

    @property
    def LastMailInterval(self):
        return config("EMAIL_REPEAT_INTERVAL", cast=float, default=3600)  # one hour

    # slack
    def getSlackInfo(self):
        url = config("SLACK_HOOK_URL", cast=str, default=None)
        if url is None:
            return None
        return {"url": url,
                "user": config("SLACK_HOOK_USER", cast=str),
                "channel": config("SLACK_HOOK_CHANNEL", cast=str),
                "title": config("SLACK_HOOK_TITLE", cast=str),
                }
