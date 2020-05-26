import logging
from typing import List

from hexbytes import HexBytes

from common.helpers import hb_to_bytes
from common.services.blockchain import BlockChainAddress, BlockchainAccount, is_error, BlockChainContract
from common.services.oracle_dao import OracleRoundInfo, RoundInfo

logger = logging.getLogger(__name__)


class CoinPairService:

    def __init__(self, contract: BlockChainContract):
        self._contract = contract

    async def coin_pair_price_call(self, method, *args, account: BlockchainAccount = None, **kw):
        return await self._contract.bc_call(method, *args, account=account, **kw)

    async def coin_pair_price_execute(self, method, *args, account: BlockchainAccount = None, wait=False, **kw):
        return await self._contract.bc_execute(method, *args, account=account, wait=wait, **kw)

    async def get_num_idle_rounds(self):
        return await self.coin_pair_price_call("numIdleRounds")

    async def get_round_lock_period_in_blocks(self):
        return await self.coin_pair_price_call("roundLockPeriodInBlocks")

    async def get_valid_price_period_in_blocks(self):
        return await self.coin_pair_price_call("validPricePeriodInBlocks")

    async def get_oracle_server_info(self):
        return await self.coin_pair_price_call("getOracleServerInfo")

    async def get_max_oracles_per_rounds(self):
        return await self.coin_pair_price_call("maxOraclesPerRound")

    async def can_remove_oracle(self, addr: BlockChainAddress):
        return await self.coin_pair_price_call("canRemoveOracle", addr)

    async def get_price(self):
        return await self.coin_pair_price_call("getPrice", account="0x" + "0" * 39 + "1")

    async def get_available_reward_fees(self):
        return await self.coin_pair_price_call("getAvailableRewardFees")

    async def publish_price(self,
                            version,
                            coin_pair,
                            price,
                            oracle_addr,
                            blocknumber,
                            signatures: List[HexBytes],
                            account: BlockchainAccount = None,
                            wait=False):
        v, r, s = [], [], []
        for signature in signatures:
            v.append(int.from_bytes(hb_to_bytes(signature[64:]), "little"))
            r.append(hb_to_bytes(signature[:32]))
            s.append(hb_to_bytes(signature[32:64]))

        return await self.coin_pair_price_execute("publishPrice", version,
                                                  coin_pair.longer(), price, oracle_addr,
                                                  blocknumber, v, r, s, account=account, wait=wait)

    async def get_coin_pair(self) -> str:
        return await self.coin_pair_price_call("coinPair")

    async def get_last_pub_block(self) -> int:
        return await self.coin_pair_price_call("getLastPublicationBlock")

    async def get_round_info(self) -> RoundInfo:
        bc_data = await self.coin_pair_price_call("getRoundInfo")
        if is_error(bc_data):
            return bc_data
        return RoundInfo(*bc_data)

    async def switch_round(self, account: BlockchainAccount = None, wait=False):
        return await self.coin_pair_price_execute("switchRound", account=account, wait=wait)

    async def get_oracle_round_info(self, address: BlockChainAddress) -> OracleRoundInfo:
        bc_data = await self.coin_pair_price_call("getOracleRoundInfo", address)
        if is_error(bc_data):
            return bc_data
        return OracleRoundInfo(*bc_data)
