import asyncio
import json
import logging
import traceback
import typing

from aiohttp import ClientConnectorError, InvalidURL, ClientResponseError
from hexbytes import HexBytes

from common import crypto, settings, helpers
from common.bg_task_executor import BgTaskExecutor
from common.crypto import verify_signature
from common.services.blockchain import is_error
from common.services.coin_pair_price_service import CoinPairPriceService
from common.services.oracle_dao import OracleRoundInfo
from oracle.src import monitor, oracle_settings
from oracle.src.oracle_blockchain_info_loop import OracleBlockchainInfoLoop
from oracle.src.oracle_configuration_loop import OracleConfigurationLoop
from oracle.src.oracle_publish_message import PublishPriceParams
from oracle.src.oracle_turn import OracleTurn
from oracle.src.price_feeder.price_feeder import PriceFeederLoop

logger = logging.getLogger(__name__)

OracleSignature = typing.NamedTuple("OracleSignature",
                                    [("addr", str),
                                     ('signature', HexBytes)])


class OracleCoinPairLoop(BgTaskExecutor):
    def __init__(self, conf: OracleConfigurationLoop,
                 cps: CoinPairPriceService,
                 price_feeder_loop: PriceFeederLoop,
                 vi_loop: OracleBlockchainInfoLoop):
        self._conf = conf
        self._oracle_addr = oracle_settings.get_oracle_account().addr
        self._cps = cps
        self._coin_pair = cps.coin_pair
        self._oracle_turn = OracleTurn(self._conf.oracle_turn_conf, cps.coin_pair)
        self._price_feeder_loop = price_feeder_loop
        self.vi_loop = vi_loop
        super().__init__(self.task_loop)

    async def task_loop(self):
        logger.info("%r : OracleCoinPairLoop start" % self._coin_pair)
        round_info = await self._cps.get_round_info()
        if is_error(round_info):
            logger.error("%r : OracleCoinPairLoop ERROR getting round info %r" % (self._coin_pair, round_info))
            return self._conf.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL

        if round_info.round == 0:
            logger.warning("%r : OracleCoinPairLoop Waiting for the initial round...", (self._coin_pair,))
            return self._conf.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL

        exchange_price = await self._price_feeder_loop.get_last_price()
        if not exchange_price or exchange_price.ts_utc <= 0:
            logger.warning(
                "%r : OracleCoinPairLoop Still don't have a valid price %r" % (self._coin_pair, exchange_price))
            return self._conf.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL

        blockchain_info = self.vi_loop.get()
        if not blockchain_info:
            logger.info("%r : OracleCoinPairLoop waiting for blockchain info" % self._coin_pair)
            return self._conf.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL

        if self._oracle_turn.is_oracle_turn(blockchain_info, self._oracle_addr, exchange_price):
            logger.info("%r : OracleCoinPairLoop ------------> Is my turn I'm chosen: %s block %r" %
                        (self._coin_pair, self._oracle_addr, blockchain_info.block_num))
            publish_success = await self.publish(blockchain_info.selected_oracles,
                                                 PublishPriceParams(self._conf.MESSAGE_VERSION,
                                                                    self._coin_pair,
                                                                    exchange_price,
                                                                    self._oracle_addr,
                                                                    blockchain_info.last_pub_block))
            if not publish_success:
                # retry immediately.
                return 1
        else:
            logger.info("%r : OracleCoinPairLoop ------------> Is NOT my turn: %s block %r" %
                        (self._coin_pair, self._oracle_addr, blockchain_info.block_num))
        return self._conf.ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL

    async def publish(self, oracles, params: PublishPriceParams):
        message = params.prepare_price_msg()
        signature = crypto.sign_message(hexstr="0x" + message, account=oracle_settings.get_oracle_account())
        logger.debug("%r : %r GOT MESSAGE %r" % (self._coin_pair, self._oracle_addr, message))
        logger.info("%r : OracleCoinPairLoop %r GOT MESSAGE params %r and signature %r" %
                    (self._coin_pair, self._oracle_addr, params, signature))

        # send message to all oracles to sign
        logger.info("%r : OracleCoinPairLoop %r GATHERING SIGNATURES, last pub block %r, price %r" %
                    (self._coin_pair, self._oracle_addr, params.last_pub_block, params.price))
        sigs = await gather_signatures(oracles, params, message, signature,
                                       timeout=self._conf.ORACLE_GATHER_SIGNATURE_TIMEOUT)
        if len(sigs) < len(oracles) // 2 + 1:
            logger.error(
                "%r : OracleCoinPairLoop %r Publish: Not enough signatures" % (self._coin_pair, self._oracle_addr))
            return False

        if settings.DEBUG:
            logger.info(
                "%r : OracleCoinPairLoop %r GOT SIGS %r and params %r recover %r" %
                (self._coin_pair, self._oracle_addr, sigs, params,
                 [crypto.recover(hexstr=message, signature=x) for x in sigs]))

        monitor.publish_log("%r : %r publishing price: %r" % (self._coin_pair, self._oracle_addr, params.price))
        try:
            logger.info("%r : OracleCoinPairLoop %r SENDING TRANSACTION, last pub block %r, price %r" %
                        (self._coin_pair, self._oracle_addr, params.last_pub_block, params.price))
            tx = await self._cps.publish_price(params.version,
                                               params.coin_pair,
                                               params.price,
                                               params.oracle_addr,
                                               params.last_pub_block,
                                               sigs,
                                               account=oracle_settings.get_oracle_account(),
                                               wait=True)
            if is_error(tx):
                logger.info("%r : OracleCoinPairLoop %r ERROR PUBLISHING %r" % (self._coin_pair, self._oracle_addr, tx))
                return False
            logger.info(
                "%r : OracleCoinPairLoop %r --------------------> PRICE PUBLISHED %r" % (
                    self._coin_pair, self._oracle_addr, tx))
            # Last pub block has changed, force an update of the block chain info.
            await self.vi_loop.force_update()
            return True
        except asyncio.CancelledError as e:
            raise e
        except Exception as err:
            logger.error("%r : OracleCoinPairLoop %r Publish: %r" % (self._coin_pair, self._oracle_addr, err))
            logger.warning(traceback.format_exc())
            return False


async def gather_signatures(oracles, params: PublishPriceParams, message, my_signature, timeout=10):
    cors = [
        get_signature(oracle, params, message, my_signature, timeout=timeout)
        for oracle in oracles if oracle.addr != params.oracle_addr]
    sigs = await asyncio.gather(*cors, return_exceptions=True)
    sigs.append(OracleSignature(params.oracle_addr, my_signature))
    # Sort signatures by addr so the smart contract accept them.
    sorted_sigs = sorted([x for x in sigs if x is not None], key=lambda y: int(y.addr, 16))
    return [x.signature for x in sorted_sigs]


async def get_signature(oracle: OracleRoundInfo, params: PublishPriceParams, message, my_signature, timeout=10):
    target_uri = oracle.internetName + "/sign/"
    logger.info("%s : Trying to get signatures from: %s == %s" % (params.coin_pair, target_uri, oracle.addr), )
    try:
        post_data = {
            "version": str(params.version),
            "coin_pair": str(params.coin_pair),
            "price": str(params.price),
            "price_timestamp": str(params.price_ts_utc),
            "oracle_addr": params.oracle_addr,
            "last_pub_block": str(params.last_pub_block),
            "signature": my_signature.hex()}
        raise_for_status = True
        if settings.DEBUG:
            raise_for_status = False
        response, status = await helpers.request_post(target_uri, post_data,
                                                      timeout=timeout,
                                                      raise_for_status=raise_for_status)
        if status != 200:
            logger.error(
                "%s : Signature rejected by %s, %s : %s" % (params.coin_pair, oracle.addr,
                                                            oracle.internetName, response))
            return
        obj = json.loads(response)
        if "signature" not in obj:
            logger.error(
                "%s : Missing signature from: %s,%s" % (params.coin_pair, oracle.addr, oracle.internetName))
            return
        signature = HexBytes(obj["signature"])
    except asyncio.CancelledError as e:
        raise e
    except asyncio.TimeoutError as e:
        logger.info("%s : Timeout from: %s, %s" % (params.coin_pair, oracle.addr, oracle.internetName))
        return
    except ClientResponseError as err:
        logger.info("%s : Invalid response from: %s, %s -> %r" % (
            params.coin_pair, oracle.addr, oracle.internetName, err.message))
        return
    except ClientConnectorError:
        logger.error("%s : Error connecting to: %s, %s" % (params.coin_pair, oracle.addr, oracle.internetName))
        return
    except InvalidURL:
        logger.error("%s : The oracle %s, %s is registered with a wrong url!!!" % (
            params.coin_pair, oracle.addr, oracle.internetName))
        return
    except Exception as err:
        logger.error(
            "%s : Unexpected exception from %s,%s: %r" % (
                params.coin_pair, oracle.addr, oracle.internetName, err))
        logger.warning(traceback.format_exc())
        return

    if not verify_signature(oracle.addr, message, signature):
        return

    # TODO: Verify that the oracle it is stil in the aproved set (to avoid consuming gas later)
    logger.info("%s : Got valid signature from: %s, %s" % (params.coin_pair, oracle.addr, oracle.internetName))
    return OracleSignature(oracle.addr, signature)
