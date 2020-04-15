import logging
import typing

from common import helpers
from common.services.oracle_dao import CoinPair, PriceWithTimestamp

logger = logging.getLogger(__name__)


class PublishPriceParams(typing.NamedTuple('PublishPriceParams', [('version', int),
                                                                  ('coin_pair', CoinPair),
                                                                  ('price', int), ('price_ts_utc', int),
                                                                  ('oracle_addr', str),
                                                                  ('last_pub_block', int)])):

    def __new__(cls, version: int, coin_pair: CoinPair, price: PriceWithTimestamp,
                oracle_addr: str, last_pub_block: int):
        return super(PublishPriceParams, cls).__new__(cls, version, coin_pair,
                                                      price.price, price.ts_utc,
                                                      oracle_addr,
                                                      last_pub_block)

    def prepare_price_msg(self):
        parameters = [self.version,
                      self.coin_pair.longer(),
                      self.price,
                      helpers.addr_to_number(self.oracle_addr),
                      self.last_pub_block]
        fs = [helpers.enc_uint256, helpers.enc_byte32, helpers.enc_uint256, helpers.enc_packed_address,
              helpers.enc_uint256]
        # encVersion = enc_uint256(version)
        # encPrice = enc_uint256(price)
        # encOracle = enc_address(cfg.address)
        # encBlockNum = enc_uint256(blocknr)
        # header = bytes(MSG_HEADER, "ascii").hex()
        full_msg = (''.join(f(x) for f, x in zip(fs, parameters)))  ## header +
        logger.debug(logging.INFO, "msg: " + full_msg)
        return full_msg
