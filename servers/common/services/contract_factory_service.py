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
    FILES = {
        "ETERNAL_STORAGE": "EternalStorageGobernanza.json"
        , "MOC_ERC20": "TestMOC.json"
        , "SUPPORTERS": "SupportersVested.json"
        , "ORACLE_MANAGER": "OracleManager.json"
        , "COIN_PAIR_PRICE": "CoinPairPrice.json"
    }
    DATA = dict()

    @staticmethod
    def get_contract_factory_service():
        if settings.DEVELOP:
            return LocalContractFactoryService()
        raise Exception("Unimplemented")

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

    def get_addr(self, name):
        if not settings.DEVELOP:
            raise Exception("Only for development!!!")
        return None


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

    def get_addr(self, name):
        if not settings.DEVELOP:
            raise Exception("Only for development!!!")
        return None


class LocalContractFactoryService(ContractFactoryService):

    def get_coin_pair_price(self, addr) -> CoinPairService:
        data = self._read_data("COIN_PAIR_PRICE")
        return CoinPairService(blockchain.BlockChainContract(addr, data["abi"]))

    def get_eternal_storage(self, addr) -> EternalStorageService:
        data = self._read_data("ETERNAL_STORAGE")
        return EternalStorageService(blockchain.BlockChainContract(addr, data["abi"]))

    def get_moc_token(self, addr) -> MocTokenService:
        data = self._read_data("MOC_ERC20")
        return MocTokenService(blockchain.BlockChainContract(addr, data["abi"]))

    def get_oracle_manager(self, addr) -> OracleManagerService:
        data = self._read_data("ORACLE_MANAGER")
        return OracleManagerService(blockchain.BlockChainContract(addr, data["abi"]))

    def get_supporters(self, addr) -> SupportersService:
        data = self._read_data("SUPPORTERS")
        return SupportersService(blockchain.BlockChainContract(addr, data["abi"]))

    @classmethod
    def get_addr(cls, name):
        if not settings.DEVELOP:
            raise Exception("Only for development!!!")
        data = cls._read_data(name)
        networks = data["networks"]
        network_id = next(iter(networks)) if len(networks) == 1 else settings.DEVELOP_NETWORK_ID
        logger.info("Using network id %r for %s" % (network_id, name))
        return blockchain.parse_addr(data["networks"][str(network_id)]["address"])

    @classmethod
    def _read_data(cls, name):
        if not settings.DEVELOP:
            raise Exception("Only for development!!!")
        if name in cls.DATA:
            return cls.DATA[name]
        if name not in cls.FILES:
            raise ValueError("Invalid file name %s " % name)
        data = helpers.readfile(settings.CONTRACT_FOLDER, cls.FILES[name])
        cls.DATA[name] = data
        return data
