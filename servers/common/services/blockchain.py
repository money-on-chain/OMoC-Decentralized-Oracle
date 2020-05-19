import asyncio
import logging
import traceback
import typing

from decorator import decorator
from eth_typing import Primitives, HexStr
from pydantic import UrlStr
from starlette.datastructures import Secret
from web3 import Web3, HTTPProvider
from web3.exceptions import TransactionNotFound

logger = logging.getLogger(__name__)

ZERO_ADDR = "0x0000000000000000000000000000000000000000";


def keccak256(text: str = None, hexstr: HexStr = None, primitive: Primitives = None):
    return Web3.keccak(primitive=primitive, text=text, hexstr=hexstr)


def parse_addr(addr):
    return Web3.toChecksumAddress(addr)


class STATE:
    PENDING, SUCCESS, FAILED, ERROR = 'pending', 'success', 'failed', 'error'


BCSuccess = typing.NamedTuple("BCSuccess", [("state", STATE), ("hash", str)])


class BCError(typing.NamedTuple("BCError", [("state", STATE), ("hash", str), ("error", str)])):

    def __new__(cls, err, hash):
        return super(BCError, cls).__new__(cls, STATE.ERROR, hash, err)

    @classmethod
    def Get(cls, err):
        return cls(str(err), None)


def is_error(tx):
    return isinstance(tx, BCError)


async def run_in_executor(func):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, func)


@decorator
async def exec_with_catch_async(f, *arg, **kw):
    try:
        return await f(*arg, **kw)
    except asyncio.CancelledError as e:
        raise e
    except Exception as err:
        logger.debug(traceback.format_exc())
        return BCError.Get(err)


class BlockChainAddress(UrlStr):
    @classmethod
    def __get_validators__(cls) -> 'CallableGenerator':
        yield cls.validate

    @classmethod
    def validate(cls, v) -> str:
        if not isinstance(v, str):
            raise ValueError(f'strict string: str expected not {type(v)}')
        return parse_addr(v.lower())


class BlockchainAccount(typing.NamedTuple('BlockchainAccount', [('addr', str), ('key', Secret)])):
    def __new__(cls, addr, key):
        addr = parse_addr(addr.lower())
        if not isinstance(key, Secret):
            raise Exception("Key must be secret")
        skey = str(key)
        if skey.startswith("0x"):
            skey = skey[2:]
        return super(BlockchainAccount, cls).__new__(cls, addr, Secret(skey))


class BlockChainPK(UrlStr):
    @classmethod
    def __get_validators__(cls) -> 'CallableGenerator':
        yield cls.validate

    @classmethod
    def validate(cls, v) -> str:
        if not isinstance(v, str):
            raise ValueError(f'strict string: str expected not {type(v)}')
        return Web3.eth.account.from_key(v).key


class BlockChain:
    def __init__(self, node_url, chain_id, timeout):
        self.chain_id = chain_id
        self.W3 = Web3(HTTPProvider(str(node_url), request_kwargs={'timeout': timeout}))

    def get_contract(self, addr, abi):
        return self.W3.eth.contract(address=parse_addr(addr), abi=abi)

    def sign_transaction(self, txn, private_key):
        return self.W3.eth.account.sign_transaction(txn, private_key)

    def send_raw_transaction(self, raw_transaction: HexStr):
        return self.W3.eth.sendRawTransaction(raw_transaction)

    @exec_with_catch_async
    async def get_last_block(self):
        return await run_in_executor(lambda: self.W3.eth.blockNumber)

    @exec_with_catch_async
    async def get_block_by_number(self, block_number, full=False):
        return await run_in_executor(lambda: self.W3.eth.getBlock(block_number, full))

    async def get_tx(self, method, account_addr: str):
        from_addr = parse_addr(str(account_addr))
        gas_price = await run_in_executor(lambda: self.W3.eth.gasPrice)
        nonce = await run_in_executor(lambda: self.W3.eth.getTransactionCount(from_addr))
        try:
            logger.debug("GAS: %r" % gas_price)
            gas = await run_in_executor(lambda: method.estimateGas({'from': from_addr,
                                                                    'gasPrice': gas_price,
                                                                    'nonce': nonce}))
        except asyncio.CancelledError as e:
            raise e
        except Exception as err:
            logger.debug("USING DEFAULT VALUE FOR GAS LIMIT")
            gas = 4200000  # adji: Must be enough, can't be to close to gas limit

        chain_id = await run_in_executor(lambda: self.W3.eth.chainId)
        if not chain_id:
            chain_id = self.chain_id
        if not chain_id:
            raise Exception("Can't get chain id from block chain, must be configured")
        data = {'from': from_addr,
                'chainId': chain_id,
                'gasPrice': gas_price,
                'gas': gas,
                'nonce': nonce}

        txn = method.buildTransaction(data)
        return {"tx": txn, "txdata": data}

    @exec_with_catch_async
    async def bc_transfer(self, to_addr: str, amount: int, account: BlockchainAccount = None, wait=False):
        from_addr = parse_addr(account.addr)
        nonce = await run_in_executor(lambda: self.W3.eth.getTransactionCount(from_addr))
        txn = {'from': from_addr,
               # 'chainId': W3.eth.chainId,
               'gasPrice': self.W3.eth.gasPrice,
               'gas': 21000,
               'nonce': nonce,
               'to': parse_addr(to_addr),
               'value': amount,
               'data': b'',
               }
        signed_txn = self.W3.eth.account.sign_transaction(txn, private_key=Web3.toBytes(hexstr=str(account.key)))
        tx = await run_in_executor(lambda: self.W3.eth.sendRawTransaction(signed_txn.rawTransaction))
        return await self.process_tx(tx, wait)

    async def process_tx(self, tx, wait):
        if isinstance(tx, dict) and "error" in tx:
            logger.error("TX ERROR", tx)
            return BCError(STATE.ERROR, tx)
        if wait:
            logger.debug("return_tx %r", tx)
            ret = await self.get_receipt(tx, wait)
            logger.debug("return_tx %r receipt %r", tx, ret)
            if isinstance(ret, dict) and "error" in ret:
                return BCError(STATE.ERROR, ret, tx)
            return BCSuccess(ret['state'], tx)
        return BCSuccess(STATE.SUCCESS, tx)

    @exec_with_catch_async
    async def get_balance(self, addr: BlockChainAddress):
        return await run_in_executor(lambda: self.W3.eth.getBalance(addr))

    async def get_receipt(self, txhash: str, wait: bool = False, timeout=60 * 10, poll_latency=0.1):
        if wait:
            async def run_with_timeout():
                while True:
                    try:
                        receipt = await run_in_executor(lambda: self.W3.eth.getTransactionReceipt(txhash))
                        if receipt is not None and receipt['blockHash'] is not None:
                            return receipt
                    except TransactionNotFound:
                        pass
                    await asyncio.sleep(1)  # poll_latency)

            receipt = await asyncio.wait_for(run_with_timeout(), timeout=timeout)
            # receipt = await loop.run_in_executor(None, lambda: W3.eth.waitForTransactionReceipt(txhash, timeout=timeout,
            #                                                                                    poll_latency=poll_latency))
        else:
            receipt = await run_in_executor(lambda: self.W3.eth.getTransactionReceipt(txhash))
        if not receipt:
            return {'tx': txhash, 'state': STATE.PENDING}
        return {'tx': receipt.transactionHash.hex(),
                'block': receipt.blockHash.hex(),
                'gasUsed': receipt.gasUsed,
                'status': receipt.status,
                'state': (STATE.SUCCESS if receipt.status != 0 else STATE.FAILED)}


class BlockChainContract:

    def __init__(self, blockchain: BlockChain, addr, abi):
        self.blockchain = blockchain
        self.contract = blockchain.get_contract(addr, abi)

    def get_blockchain(self):
        return self.blockchain

    @exec_with_catch_async
    async def bc_call(self, method, *args, account: BlockchainAccount = None, **kw):
        return await run_in_executor(lambda: self.contract.functions[method](*args, **kw).call(
            {'from': account} if account else {}))

    @exec_with_catch_async
    async def bc_execute(self, method, *args, account: BlockchainAccount = None, wait=False, **kw):
        if not account:
            raise Exception("Missing key, cant execute")
        method = self.contract.functions[method](*args, **kw)
        tx = await self.blockchain.get_tx(method, str(account.addr))
        txn = tx["tx"]
        signed_txn = self.blockchain.sign_transaction(txn, private_key=Web3.toBytes(hexstr=str(account.key)))
        logger.debug("%s SENDING SIGNED TX %r", tx["txdata"]["chainId"], signed_txn)
        tx = await run_in_executor(lambda: self.blockchain.send_raw_transaction(signed_txn.rawTransaction))
        return await self.blockchain.process_tx(tx, wait)
