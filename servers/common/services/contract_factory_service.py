import logging

from moneyonchain.manager import ConnectionManager

from common import settings, helpers
from common.services import blockchain
from common.services.coin_pair_price_service import CoinPairService
from common.services.ethernal_storage_service import EternalStorageService
from common.services.moc_token_service import MocTokenService
from common.services.oracle_manager_service import OracleManagerService
from common.services.supporters_service import SupportersService

logger = logging.getLogger(__name__)


class ContractFactoryService:
    def get_coin_pair_price(self, addr) -> CoinPairService:
        raise Exception("Unimplemented")

    def get_eternal_storage(self, addr) -> EternalStorageService:
        raise Exception("Unimplemented")

    def get_moc_token(self, addr) -> MocTokenService:
        raise Exception("Unimplemented")

    def get_oracle_manager(self, addr) -> OracleManagerService:
        raise Exception("Unimplemented")

    def get_supporters(self, addr) -> SupportersService:
        raise Exception("Unimplemented")


class MocContractFactoryService(ContractFactoryService):
    def __init__(self, network):
        self.connection_manager = ConnectionManager(network=network)

    def get_coin_pair_price(self):
        raise Exception("Unimplemented")

    def get_eternal_storage(self):
        raise Exception("Unimplemented")

    def get_moc_token(self):
        raise Exception("Unimplemented")

    def get_oracle_manager(self):
        raise Exception("Unimplemented")

    def get_supporters(self):
        raise Exception("Unimplemented")


class LocalContractFactoryService(ContractFactoryService):
    COIN_PAIR_PRICE_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "CoinPairPrice.json")
    COIN_PAIR_PRICE_ABI = COIN_PAIR_PRICE_DATA["abi"]
    ETERNAL_STORAGE_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "EternalStorageGobernanza.json")
    ETERNAL_STORAGE_ABI = ETERNAL_STORAGE_DATA["abi"]
    ETERNAL_STORAGE_ADDR = blockchain.parse_addr(ETERNAL_STORAGE_DATA["networks"][str(settings.NETWORK_ID)]["address"])
    MOC_ERC20_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "TestMOC.json")
    MOC_ERC20_ABI = MOC_ERC20_DATA["abi"]
    MOC_ERC20_ADDR = blockchain.parse_addr(MOC_ERC20_DATA["networks"][str(settings.NETWORK_ID)]["address"])
    SUPPORTERS_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "SupportersVested.json")
    SUPPORTERS_ABI = SUPPORTERS_DATA["abi"]
    SUPPORTERS_ADDR = blockchain.parse_addr(SUPPORTERS_DATA["networks"][str(settings.NETWORK_ID)]["address"])
    ORACLE_MANAGER_DATA = helpers.readfile(settings.CONTRACT_FOLDER, "OracleManager.json")
    ORACLE_MANAGER_ABI = ORACLE_MANAGER_DATA["abi"]
    # ORACLE_MANAGER_ADDR = blockchain.parse_addr(ORACLE_MANAGER_DATA["networks"][str(settings.NETWORK_ID)]["address"])

    def __init__(self):
        pass

    def get_coin_pair_price(self, addr) -> CoinPairService:
        return CoinPairService(blockchain.BlockChainContract(addr, self.COIN_PAIR_PRICE_ABI))

    def get_eternal_storage(self, addr) -> EternalStorageService:
        return EternalStorageService(blockchain.BlockChainContract(addr, self.ETERNAL_STORAGE_ABI))

    def get_moc_token(self, addr) -> MocTokenService:
        return MocTokenService(blockchain.BlockChainContract(addr, self.MOC_ERC20_ABI))

    def get_oracle_manager(self, addr) -> OracleManagerService:
        return OracleManagerService(blockchain.BlockChainContract(addr, self.ORACLE_MANAGER_ABI))

    def get_supporters(self, addr) -> SupportersService:
        return SupportersService(blockchain.BlockChainContract(addr, self.SUPPORTERS_ABI))
