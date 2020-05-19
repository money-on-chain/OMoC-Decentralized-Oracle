import logging
import os

from moneyonchain import contract
from moneyonchain.manager import ConnectionManager

from common import settings, helpers
from common.services import blockchain
from common.services.coin_pair_price_service import CoinPairService
from common.services.eternal_storage_service import EternalStorageService
from common.services.moc_token_service import MocTokenService
from common.services.oracle_manager_service import OracleManagerService
from common.services.supporters_service import SupportersService

logger = logging.getLogger(__name__)


class ContractFactoryService:

    @staticmethod
    def get_contract_factory_service():
        if settings.MOC_NETWORK is not None:
            logger.info("Using moneyonchain library for contracts abis and addresses")
            return MocContractFactoryService(settings.MOC_NETWORK)
        else:
            logger.warning("Using build dir development files for contracts abis and addresses!!!")
            return BuildDirContractFactoryService()

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
        raise Exception("Unimplemented")


class MocContractFactoryService(ContractFactoryService):
    def __init__(self, network):
        self.abi_path = os.path.join(os.path.dirname(os.path.realpath(contract.__file__)), "abi")
        options = ConnectionManager.options_from_config()
        networks = options["networks"]
        if network not in networks:
            raise Exception("Invalid moc network name %r" % network)
        self.options = networks[network]
        if "addresses" not in self.options:
            raise Exception("Addresses missing in moneyonchain library options!!!")
        self.addresses = self.options["addresses"]

    def get_coin_pair_price(self, addr) -> CoinPairService:
        abi = self._read_abi('CoinPairPrice.abi')
        return CoinPairService(blockchain.BlockChainContract(addr, abi))

    def get_eternal_storage(self, addr) -> EternalStorageService:
        abi = self._read_abi('EternalStorageGobernanza.abi')
        return EternalStorageService(blockchain.BlockChainContract(addr, abi))

    def get_moc_token(self, addr) -> MocTokenService:
        abi = self._read_abi('DocToken.abi')
        return MocTokenService(blockchain.BlockChainContract(addr, abi))

    def get_oracle_manager(self, addr) -> OracleManagerService:
        abi = self._read_abi('OracleManager.abi')
        return OracleManagerService(blockchain.BlockChainContract(addr, abi))

    def get_supporters(self, addr) -> SupportersService:
        abi = self._read_abi('SupportersVested.abi')
        return SupportersService(blockchain.BlockChainContract(addr, abi))

    def get_addr(self, name):
        if name == "ETERNAL_STORAGE" and "EternalStorageGobernanza" in self.addresses:
            return self.addresses["EternalStorageGobernanza"]
        return None

    def _read_abi(self, file_name):
        return contract.Contract.content_abi_file(os.path.join(self.abi_path, file_name))


class BuildDirContractFactoryService(ContractFactoryService):
    FILES = {
        "ETERNAL_STORAGE": "EternalStorageGobernanza.json"
        , "MOC_ERC20": "TestMOC.json"
        , "SUPPORTERS": "SupportersVested.json"
        , "ORACLE_MANAGER": "OracleManager.json"
        , "COIN_PAIR_PRICE": "CoinPairPrice.json"
    }
    DATA = dict()

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
        data = cls._read_data(name)
        networks = data["networks"]
        network_id = next(iter(networks)) if len(networks) == 1 else settings.DEVELOP_NETWORK_ID
        logger.info("Using network id %r for %s" % (network_id, name))
        return blockchain.parse_addr(data["networks"][str(network_id)]["address"])

    @classmethod
    def _read_data(cls, name):
        if name in cls.DATA:
            return cls.DATA[name]
        if name not in cls.FILES:
            raise ValueError("Invalid file name %s " % name)
        data = helpers.readfile(settings.CONTRACT_FOLDER, cls.FILES[name])
        cls.DATA[name] = data
        return data
