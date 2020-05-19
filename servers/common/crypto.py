import logging

from eth_account import Account
from eth_account.messages import encode_defunct
from hexbytes import HexBytes

from common.services.blockchain import BlockchainAccount

logger = logging.getLogger(__name__)


def addr_from_key(key):
    return Account.from_key(key).address


def _sign_msghash(msghash, key):
    return Account.sign_message(msghash, key)


def sign_message(text=None, hexstr=None, account: BlockchainAccount = None):
    msghash = encode_defunct(text=text, hexstr=hexstr)
    result = _sign_msghash(msghash, str(account.key))
    return result["signature"]


def sign_message_hex(text=None, hexstr=None, account: BlockchainAccount = None):
    s = sign_message(text, hexstr, account)
    return HexBytes(s.hex())


def recover(text=None, hexstr=None, signature=None):
    msg = encode_defunct(text=text, hexstr=hexstr)
    return Account.recover_message(msg, signature=signature)


def verify_signature(address, message, signature):
    ret = (address == recover(hexstr=message, signature=signature))
    if not ret:
        logger.error("Invalid signature from: %s" % address)
    return ret
