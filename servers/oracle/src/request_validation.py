import logging

from hexbytes import HexBytes

from common import crypto, helpers
from common.crypto import verify_signature
from common.services.oracle_dao import PriceWithTimestamp
from oracle.src import oracle_settings
from oracle.src.oracle_blockchain_info_loop import OracleBlockchainInfo
from oracle.src.oracle_publish_message import PublishPriceParams
from oracle.src.oracle_turn import OracleTurn

logger = logging.getLogger(__name__)


class ValidationFailure(Exception):
    def __init__(self, msg, cp):
        super(ValidationFailure, self).__init__(msg)
        logger.warning("%r : %s" % (cp, msg))


class InvalidSignature(ValidationFailure):
    pass


class InvalidTurn(ValidationFailure):
    pass


class NoBlockchainData(ValidationFailure):
    pass


class DifferentLastPubBlock(ValidationFailure):
    pass


class RequestValidation:
    def __init__(self,
                 oracle_price_reject_delta_pct,
                 params: PublishPriceParams,
                 oracle_turn: OracleTurn,
                 exchange_price: PriceWithTimestamp,
                 blockchain_info: OracleBlockchainInfo):
        self.oracle_price_reject_delta_pct = oracle_price_reject_delta_pct
        self.params = params
        self.oracle_turn = oracle_turn
        self.exchange_price = exchange_price
        self.blockchain_info = blockchain_info

    @property
    def cp(self):
        return self.params.coin_pair

    def validate_and_sign(self, signature):
        self.validate_params()
        self.validate_turn()
        message = self.params.prepare_price_msg()
        self.validate_signature(message, signature)
        s = crypto.sign_message(hexstr="0x" + message,
                                account=oracle_settings.get_oracle_account())
        logger.info("%r : sign result: %s" % (self.params.coin_pair, repr(s)))
        return message, s

    def validate_params(self):
        if not self.params or not self.blockchain_info:
            raise NoBlockchainData("Still don't have a valid block chain info "
                                   "params %r block chain info %r" % (
                                       self.params, self.blockchain_info), self.cp)

        if self.params.last_pub_block != self.blockchain_info.last_pub_block:
            raise DifferentLastPubBlock("Different last publication blocks %r "
                                        "!= %r" % (self.params.last_pub_block,
                                                   self.blockchain_info.last_pub_block),
                                        self.cp)

        if (not self.exchange_price or not self.exchange_price.price or
                self.exchange_price.ts_utc <= 0):
            raise NoBlockchainData("Still don't have a valid price %r" % (
                self.exchange_price,), self.cp)

        if not self.params.price or self.params.price_ts_utc <= 0:
            raise ValidationFailure("Invalid publish price %r" %
                                    self.params.price, self.cp)

        price_delta = helpers.price_delta(self.params.price,
                                          self.exchange_price.price)
        if price_delta > self.oracle_price_reject_delta_pct:
            raise ValidationFailure("price out of range delta %r > %r and "
                                    "price %r exchange price %r" % (price_delta,
                                                                    self.oracle_price_reject_delta_pct,
                                                                    self.params.price, self.exchange_price.price),
                                    self.cp)

    def validate_turn(self):
        is_turn, msg = self.oracle_turn.validate_turn(
            self.blockchain_info, self.params.oracle_addr, self.exchange_price)
        if not is_turn:
            raise InvalidTurn("is not oracle %s turn : %s" % (
                self.params.oracle_addr, msg), self.cp)

    def validate_signature(self, message, signature):
        if not verify_signature(self.params.oracle_addr, message,
                                HexBytes(signature)):
            raise InvalidSignature("oracle %s invalid signature" %
                                   self.params.oracle_addr, self.cp)
