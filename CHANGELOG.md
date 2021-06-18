# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.4.24](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.23...v1.4.24) (2021-06-18)


### Bug Fixes

* fix a test now that helpers.publish sorts the addresses ([e09f050](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/e09f0509b4feb431e48368b85c01ac27181c87cb))

### [1.4.23](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.22...v1.4.23) (2021-06-17)


### Features

* add tests for the Staking deposits fix ([ac18d07](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ac18d076cb289cf6782952ecc533b0ee12dfc2c1))
* remove the revert in isSubscribed, tests for OracleManager and Coinpari ([e96919c](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/e96919c004e2d40ef6adf44b5b2820bdca8d1fb7))
* use moc-shared 1.3.6, add the necesary overrides ([e5284fc](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/e5284fc3c0edf13ee11a59e6ceaacd6f665e23be))


### Bug Fixes

* fix a test that missed an await when calling expectRevert ([91b6fc1](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/91b6fc1e8e1c638b8e9fb6ad429e4ef862fa77cc))
* fix a test that was sending funds with the wrong address ([dd5c5af](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/dd5c5af2a1f40941ccf1b96a72a9e6f7646d7fe2))
* fix OracleManager, unsubscribe+withdraw is punished same as withdraws only ([1327dd5](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1327dd5c2718fe492918edffaf9c432aab15ca47))
* fixed a test that was missing an await and failed randomly ([319863f](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/319863f5cfe881380f338cda3d93156067f77dc7))
* make canRemove and removeOracle consistent ([f5454ef](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f5454efb20dcdb1e5a310a3130f0c7aacdc32ecf))
* remove the posibility to deposit to third parties in the staking machine ([97a6e77](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/97a6e77cfb080180c6ba154b5747462bc6f4d62a))
* use the delaymachine for tests ([e20a26c](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/e20a26cc6b1b5e6461891bc629f17280dd1a6d55))

### [1.4.22](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.21...v1.4.22) (2021-05-06)

### [1.4.21](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.20...v1.4.21) (2021-05-05)


### Bug Fixes

* **workflow:** upgrade the moc-shared version we use ([3e3ce60](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3e3ce60a1c709dfefb38b6164e1bd885aefb4fd4))

### [1.4.20](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.19...v1.4.20) (2021-05-05)


### Bug Fixes

* **workflow:** set MOC_SC_SHARED_AUTH_TOKEN env var for the whole job ([7757678](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/77576788d3bb4b9843de0199ee9ede24ec91986a))

### [1.4.19](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.18...v1.4.19) (2021-05-05)

### [1.4.18](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.17...v1.4.18) (2021-05-05)


### Features

* use the [@coinfabrik](https://github.com/coinfabrik) solidity flattener ([51d83f5](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/51d83f578f296e2840df46defc32a0c3b3743125))


### Bug Fixes

* **workflow:** generate package-lock.json with a downgraded npm version ([a756368](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/a75636860ac1e918dd6044faafab0d612c714e82))
* **workflow:** try to fix workflow errors ([9bc513c](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/9bc513cb092b12691eaf8d06dcdb8c5fa88f21e4))

### [1.4.17](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.16...v1.4.17) (2021-05-04)


### Bug Fixes

* **workflow:** remove [@truffle](https://github.com/truffle) packages to test ([17aab17](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/17aab175998df86ce7556527aa48efcd28759f2c))

### [1.4.16](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.15...v1.4.16) (2021-05-04)


### Bug Fixes

* **workflow:** setup the npmrc the right way ([72bfb40](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/72bfb40b0a45a62a9cd80060c426e545b513b699))

### [1.4.15](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.14...v1.4.15) (2021-05-04)


### Bug Fixes

* **workflow:** remove the flattener dependecy to try to build ([1e12a10](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1e12a1094c84875ca67e3690e29aa8d4189bdf27))

### [1.4.14](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.13...v1.4.14) (2021-05-04)


### Bug Fixes

* **workflow:** update package-lock ([dcc4953](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/dcc495320447c25b76bf88c6728fb669f9a16c93))

### [1.4.13](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.12...v1.4.13) (2021-05-04)


### Features

* use the last flattener version (one with no dependecies) ([c63b224](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c63b224c53dff2c7d6d2b7afe2eef3364e5f1e2b))

### [1.4.12](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.11...v1.4.12) (2021-05-04)


### Features

* **workflow:** add coinfabrik github registry path ([de40e96](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/de40e9625f8bf981b5982c9f9bd54d44dcec9e5f))

### [1.4.11](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.10...v1.4.11) (2021-05-04)


### Features

* **workflow:** remote .npmrc just to test ([a260947](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/a260947be059bd6b9451ba59bc82d2b60ee0e122))

### [1.4.10](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.9...v1.4.10) (2021-05-04)


### Features

* **workflow:** go back to the old workflow style ([58bf756](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/58bf7569078eb46227545630547589d23f07442e))

### [1.4.9](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.8...v1.4.9) (2021-05-04)


### Features

* **workflow:** use a better way to pass auth tokens to npm ([b88eef4](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/b88eef4bf2c8fa713d5edee945bbe5a9b5f8dc10))

### [1.4.8](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.7...v1.4.8) (2021-05-04)


### Bug Fixes

* **workflow:** remove gitlab from .npmrc ([ac33bef](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ac33bef936c00d1dd42dc5496ce433bcbff3685f))

### [1.4.7](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.6...v1.4.7) (2021-05-04)


### Features

* add SupportersStopPeriodChange use packages from coinfabrik ([98b9f74](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/98b9f74cb40319fbaf451428d867e0b2684364de))
* added a change contract to stop a suporters round ([ecdf3a0](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ecdf3a00a2f21b1de05499aa048c34da7fcd7d65))
* use [@moc](https://github.com/moc) and update the tests of SupportersStopPeriodChange ([7ec8099](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/7ec809906112203dfd55cecd3e0b9661cbdd2e4b))


### Bug Fixes

* remove an only in a test ([b3791d3](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/b3791d3b8d188445226c261742eb325721e6e160))

### [1.4.6](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.5...v1.4.6) (2021-05-03)


### Bug Fixes

* add gitlab npm token for the workflow ([db09b5e](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/db09b5eb443eff591dee1a3c7b7f11a6268a0319))

### [1.4.5](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.4...v1.4.5) (2021-05-03)


### Bug Fixes

* fix the InfoGetterFlat step now that we use npm packages ([6a27bf5](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6a27bf590d82daf5ac3c676be8a2de0a8e69c014))

### [1.4.4](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.3...v1.4.4) (2021-05-03)


### Features

* add InfoGetterFlat version ([5a0a6ae](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/5a0a6ae657bab0c40ef0080861f4095c1d30e7d2))
* added license file ([7c4f165](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/7c4f165571e63d4380d6c57cbca5d91e53b4ce0d))

### [1.4.3](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.2...v1.4.3) (2021-04-28)


### Bug Fixes

* **workflow:** run the compile step before packing ([95be413](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/95be413a76a12f6a6439c09ca749f3b57a1710f1))

### [1.4.2](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/compare/v1.4.1...v1.4.2) (2021-04-24)


### Features

* upgrade to shared 1.4.17 ([5b5de32](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/5b5de32ea5b1862069fcbc461ab0d2ae57cc5a07))

### 1.4.1 (2021-04-23)


### ⚠ BREAKING CHANGES

* **oracle manager:** It will break compilation of contracts such as CoinPairPrice

### Features

* github workflows ([ea2df12](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ea2df12cd3d8b115426e9aea48243c1d6ae1cf42))
* **oracle manager:** change contract to change the min stake reqquired for oracles ([bb6b672](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/bb6b672d5bb8187308465933d2800f930be06f8e))
* add MocRegistryOracleGatherSignatureTimeoutChange change contract ([9fc55fc](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/9fc55fc0c580b02d446db1c346e52ec08f74b04e))
* **dependencies:** dependencies for 1.2.1 ([74b500e](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/74b500e553a51ef8e936f5a6ea9072d10987d6bf))
* add change contract binaries ([432e5f7](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/432e5f70f76001c2da601e131c2ebb8a19a28c70))
* change contract to get the whitelisted emergency publishers ([5bc007d](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/5bc007d15a7a8ed9a5116b43372339cb3c78933a))
* implement the new IPriceProvider interface, version bump to 1.0.1 ([023647b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/023647b4f5d94653dbd0c0b2a7f9c9802c4f39c0))
* implemented the minimum stake to subscribe, start everything in round 1 ([bfd4b3e](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/bfd4b3eddf1c9e9507f6ca84bf3fdcd31fb26b5c))
* **build:** contract binaries ([0e7018a](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/0e7018a5611f7c61c371fc56e75346549fa02852))
* **deploy:** add contract binaries ([3dff525](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3dff5255039c2ef69bc18f2b3315f8717560f251))
* **deploy:** contarct binaries ([1e57623](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1e5762367d7e268dda394e276a97c1201bfa1532))
* **deploy:** contract binaries ([7cefbe5](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/7cefbe57d0973ffcf7f938fa8b012f6a35ee496e))
* **deploy:** contract binary ([20b6323](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/20b632319a3378718fe870cfc28a8df664f45757))
* **deploy:** contract binary ([802a63b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/802a63bd4c3cb859ab16f416b92a88810270f43c))
* **deploy:** contract binary ([b13952b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/b13952bd246d02010f527284eafc5b64a43eebf9))
* **deploy:** deploy ([6d84ee0](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6d84ee097bd73e4a0d1980518ace3c7a8924a257))
* **deploy:** during deploy don't use test moc anymore, take one from config ([f764d0c](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f764d0ce03a5a1581453bdad4abc333fdbdd856a))
* **deploy:** use an external token instead of testMoc ([1c98791](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1c98791baebfb7b072eb1d1caa59da886ab28fd6))
* **staking.sol:** adds front-end calls for querying oracle list ([32ecd83](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/32ecd83971957abc197d7a3e1aa3b76eba299b89))
* **wip:** added a withdrawLockTime that is added to expiration time ([c7f4838](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c7f483899db92670dd525841000966f3df3b120f))
* **wip:** added getLockingInfo ([9c1195b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/9c1195bea80652a1183fa0a44f9e059cf347ddd5))
* **wip:** added max subscribed oracles ([0916025](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/0916025db4035bc291422285ffb1dffe68c444f9))
* **wip:** added setOracleAddress to staking machine, getters for subscribed oracles in coin pair ([c0a33a0](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c0a33a0248ff6ed81c8eb6ed466d8ed7f7810941))
* **wip:** coinPairPrice changes, use timestamp for rounds, remove canRemoveOracle ([c209e45](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c209e45327be8b3bdca9467363f9c93553c90c31))
* **wip:** contract binaries ([50e8eb3](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/50e8eb3f5a91485392f4094d6eb4fab89cfe75f9))
* **wip:** delay machine that use one source and interacts with staking machine correctly ([4b3489c](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4b3489cae9172716a6269d76578585a266d529ff))
* **wip:** don't use anymore openzeppelin/contract use upgradeables, address set lib from moc-shared ([3e6c65d](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3e6c65db8f766db565c3aaaba16d0a26731a184a))
* **wip:** implement interfaces from moc/shared, add overrides ([51e4403](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/51e44036dee9e2ce90a070bf1ddcab3cf2013b67))
* **wip:** move coin pair and oracle manager interfaces to moc/shared ([ee5c12d](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ee5c12d3c18e16928cd6c1f4bc8800df0e9175c2))
* **wip:** stacking sell/buy tokens, take just the needed amount from the user ([f56e97f](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f56e97f65b28b5b57ec2fab29bdadbecfaf11868))
* **wip:** supporters implements ISupporters ([6c19aa6](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6c19aa6a6f5939cd78d15a72a49862e003206640))
* add test for a subscription replacing another with low stake ([594c181](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/594c1819df3405040535e98ab4bf152b1cec8cc1))
* add test for InfoGetter ([81c60d4](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/81c60d433874824a098694eb41f2713d7d4945e7))
* add test to measure gas used by sort ([129d595](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/129d595396f0958d82e60025e9c03b1dfb1c6ea0))
* add tests for operations failure on OracleManager ([6fb265a](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6fb265a95d5b8e9a1f463b76836832921f68a940))
* add to withdraw from several coinPairs ([6b8a9af](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6b8a9afceff6016ce98c2e682f72f59896920450))
* add unit test for CoinPairPriceFree ([84f9430](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/84f9430b3e348ddfd23b1e4a146467fef17d2cbc))
* add unit test to simulate onWithdraw gas consumption ([9e1dc24](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/9e1dc24891936a029549e26656a4493cb9fd50e1))
* test oracle withdraw during a round ([4a79edf](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4a79edf252feb8d4b0bfd05ec22ea43e69d36a9f))
* unit test for IterableOraclesLib ([60ba016](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/60ba01603f7c17098fc9719c219bbdff3b97cba9))
* **wip:** big merge ([bc74e03](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/bc74e03c7a7e83b03acc912d035a3eaa1053e21a))
* **wip:** new set of deploy scripts, use the moc-shared configuration and scripts ([c10d675](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c10d675e60d9fcc6e1cd106dab5a359040db2e5b))
* use a single query to Supporter's contract ([ad65094](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ad65094fe3cecedce320fcf5f72e064824407a4f))
* **wip:** added the delay machine ([d2ec4e1](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d2ec4e1370c1ccefa0e3e58cbd851fe2a34de6ef))
* **wip:** oracle and CoinPair interfaces ([de4a08a](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/de4a08a7e0c1f9501a9cdf6da58b976153a48690))
* **wip:** select list based on EnumerableSet ([533c145](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/533c1456db940242ce075de143151d1f0a3a5db9))
* **wip:** some reorder in CoinPair, added a modifier to check for onlyOracleManager calls ([dcff676](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/dcff6769f987747205cc08e29650b189a3e87245))
* **wip:** use IRegistry from moc-shared ([240bd13](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/240bd13f535487bb9e16d2650a7df0214cb794da))
* sort subscribed oracles by stake ([d06eef8](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d06eef862ff2c888d2d9e2e9c33563f1f47241e0))


### Bug Fixes

* coinpair price is taking min oracles per round from the registry ([099a4ee](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/099a4ee5954d421362687d5159ce154ba62c3535))
* fix some script so the use the new npm moc-shared package ([cf3a447](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/cf3a447a64c5ade43cbe4e6743799383ff1e4a4d))
* fixed a test ([fc3cd5c](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/fc3cd5ca7549b6d6ea6447a9fa69bfa9b54026c0))
* remove editor file ([debe68b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/debe68b4d9f677d2b6418922864b2fb88394a708))
* use packages and imports from [@money-on-chain](https://github.com/money-on-chain) instead of [@moc](https://github.com/moc) ([adfdacc](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/adfdacc58eb3da9dd0cab92f6f10517d3fc72371))
* **added require to handle error:** check that lockPeriodTimestamp is higher than current time ([4dae6f4](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4dae6f4dcca77a5d8a64fdcc743e7bd767208a8d))
* **coinpair/delay machine interaction:** fixed a bug that caused the current date to be added twice ([4e83399](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4e83399fa8702cad80f5fb87cc7971fc2109bf31))
* **coinpairprice:** fixed case for withdraw with lockPeriodTimestamp 0 ([d1a33fc](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d1a33fc32e295a5ce9bc86aad27c542bc63f8387))
* **deploy:** add an empty whitelist to the initilization of the staking machine ([6f72ed1](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6f72ed15342d98402a619e44d28c8d3de67b3315))
* **interface definition:** minor changes to interface definition ([16a9778](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/16a9778ffdddf5e7c5b5fd4b52251cbd0af3194b))
* **oracle-coinpairprice contract:** fix last pub block and moved require to where it belongs to ([6a4ed8c](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6a4ed8c6b2063a2ae2f699f3dc1f04c64ca5dc4c))
* fix to audit issue moo 001 ([6df28b7](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6df28b7b6ffdf5a628157509c975b5666099f2ca))
* fix to audit issue moo 002 ([857556b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/857556b919d123a8c8f7846353854c461daa102b))
* fix to audit issue moo 003 ([6d78610](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6d7861097f97eb96599bb597a4135e212ca8dbd3))
* fix to audit issue moo 004 ([5e56e7f](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/5e56e7f12e9c0ad74ac0a37d8eb821159001c4d8))
* fix to audit issue moo 005 ([5b98751](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/5b9875194ce151ae44ce8f4bc91f107391429e92))
* fixed a bug in emergency price publish, only whitelisted no external publishing ([ebd681d](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ebd681d138d4b3f30f5c83e24259e087692f8969))
* fixed tests after merge of audit fixes ([a0783aa](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/a0783aa6e7855c20b03ff5c8d38876704e89b50b))
* **contract init params:** added new contract param to config files ([d78e975](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d78e975923404c4dfa483c0b740d94271358a285))
* **coverage:** coverage don't support modifiers inside interfaces, change to contract ([2ab9d47](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/2ab9d47b00fcaaf19bbbbdf97212e7eaf8fa6b8d))
* **coverage:** use 20 ganache account during coverage (some tests use as many) ([ea3f466](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ea3f4668f4f7f03decc07011437c7b6385ed3182))
* **deploy:** add some more gas for rsk testnet ([3c4e9e8](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3c4e9e8d214f44d384b9de7f116895e6f98f1919))
* **deploy:** added some missing contract binaries (change contracts) used during deploy ([1e71e70](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1e71e7000ab9b69c30f3c01a158427821b5f411f))
* **deploy:** change registry settings deploy step for this project ([69cbd49](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/69cbd49feaa99fe39fef212275820ad362647bf9))
* **deploy:** don't use web3 instance, instead use the package require('web3') ([ed101ca](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ed101cae999e06ca1aec7d8a207eaba0163422db))
* **deploy:** gas adjustments for rsk testnet ([f0da899](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f0da899134ca673eacb7f6adb07f62ee9f8e0380))
* **deployment:** fixed parameters for contracts deployment ([013ba32](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/013ba320bb92668eeaf0a4c44766c8e8367c9005))
* **fix:** fixed a bug in setOracleAddress ([cf8610f](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/cf8610f6db73ea2092d9fe097e6f5bb3dd6601fd))
* **lint:** linter fixes ([98b0252](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/98b02524da0fc587c8f6ad42b33bc34d054ef999))
* **oracle manager:** fixed isOwnerRegistered and isOracleRegistered functionalities ([1fa8122](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1fa81227b705db866c440b9e0d9a407dcd80649e))
* **staking:** added whitelist for Voting Machine in lockMocs() and fixed moc unlocking bug ([3e51084](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3e510846069ad5d874f0431c3bf9a239cd3314d4))
* **wip:** add a tostring to all BN used in deploy scripts ([4d899fd](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4d899fdf46413e80cd11d69854efb8b3599636d8))
* **wip:** added spdx license to delay contracts ([ad0811b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ad0811b587faa2111e1a69e62f8a05702233009b))
* **wip:** coinPairPrice tests and fixes ([f995219](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f995219daed1550ce1f8197c1db76c91174b0a80))
* **wip:** fix some missing renames from _isOwner to _isOwnerRegistered, a whitelist in OracleManager ([a6c0d43](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/a6c0d43ede08a8cfbeb4906945753d5d5252330d))
* **wip:** fix tests after replacing public variables for getters ([3ec59db](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3ec59dbea98fe91e9a4a45d3320c225afa061e3b))
* **wip:** fix tests, a bug in removeOracle ([383657b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/383657b88367fe5279e70975f5ab31585815b973))
* **wip:** fix what prettier broke ([c5ebe64](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c5ebe64d58b17c4d3b18b2b70793a6ea4d3841c0))
* **wip:** fixed a broken test ([dc50db6](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/dc50db61f436ea3c12e0c14074e448fc0e4a3071))
* **wip:** fixed a function that was commented  in InofGetter ([6ac7728](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6ac77281ed68dac1729dd3708c8063b091b5b34f))
* **wip:** getOracleOwner implementation in OracleManager ([d539346](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d539346b4bd07ec490212185d6d0bbacc3985c55))
* **wip:** implement getters for all public variables ([f2e2d39](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f2e2d397f0e866b3086f9f98acbba9885eb0ce37))
* **wip:** initialize supporters and fix some initialization order issues ([e95fe93](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/e95fe93fa91a46ec9bb5ddce71b2bbdba1d4307a))
* **wip:** let moc-shared read the dot-env .env file ([f194608](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f19460863328259dfcb8a91b1ee00754500a9f17))
* **wip:** move lockedMocs to the storage contract ([1643374](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1643374cff8e38aec4a3928429d0f52cdd8a54b1))
* **wip:** new contract binaries ([d096635](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d096635e1f18859debb07af14f0edb2c86d7c970))
* **wip:** optimized contract binaries ([a64ceec](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/a64ceec9e19d46476a1a14b3705b93a2c573ec11))
* **wip:** remove binaries from source repo ([60771be](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/60771be5d0e4de1cc2f93c0834c217ff44c82589))
* **wip:** staking machine now implements IStakingMachineOracles ([3867041](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3867041eac437b7eab495267a1d67a2aed5de441))
* **wip:** supporters: Only whitelisted can lock funds ([1e71758](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1e717586ded261a59f5b99b55b26c062f62278fb))
* **wip:** use moc-shared from the tgz instead of the repo ([b740708](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/b74070801e6adc18cfa79466ba4d7a2007b29f3c))
* **withdraw:** fixed bug that made transfer to Delay while withdrawing fail ([e418f0b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/e418f0bd3cafb5ec297b33ccc6b086b17d9cfe26))
* add to onWithdraw test the case when an oracle is replaced ([72ff9ac](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/72ff9ac5566e2de98eb2c2626df0cd1e098e03b4))
* complete test for withdrawal during a round ([c287146](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c287146298ea0c286e49f68c522f01b6f24e5d71))
* enable test for coverage ([eb9ca1b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/eb9ca1b33c37626acf1d5d986c95f805e469228e))
* misc fixes to increase coverage ([0699bcc](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/0699bcc830070714aa0f321662f2f3e256de6d5a))
* missing parameter in coinPair initialization, rename some constants to more descriptive names ([9599780](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/9599780b42e523295af07d532ee78881322a2a45))
* test title was incorrect ([526f189](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/526f18950caa6e93db2c4f1e64f3fd011aca9c66))
* **wip:** implement moc-shared IStakingMachine in StakingMachine ([4d3f73b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4d3f73b66ff5869b6c03b4aa97f8733441a0e923))
* **wip:** iterableWhitelist based on AddressSetLib ([ebd6f98](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ebd6f9848a49b70cb7fc88e030f1e2046e6956f5))
* **wip:** oracle manager can be only called by staking machine, check oracle addr when set ([fda1bca](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/fda1bca89ab3bbd8ce732f774d8b10f333732015))
* **wip:** registered oracles based on oz set ([83d75e6](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/83d75e6e3ca62eb21af936919c153ca8b74bd264))
* **wip:** remove a .only in a test ([8a662d2](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/8a662d29d3966ead900502d6707fb9319471a8fc))
* **wip:** remove num idle round from tests and deploy scripts ([2c1068d](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/2c1068df1408f27a47d46d80a2fa7cef85947b48))
* **wip:** remove numIdleRounds ([33d4f3a](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/33d4f3a728c37f7e6d9119d3bff181ba038799fb))
* **wip:** subscribed oracles and selected are disjoint lists, don't use the length difference ([7c4bff0](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/7c4bff0b944e74011503441371ffc53268a0bced))
* **wip:** use Governor from moc-shared in tests, added back TestMOC for now ([1020b91](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1020b91fbbac96d0becea614c4e1dc378d442376))
* **wip:** use interfaces that now are in moc-shared ([6fb24a4](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6fb24a42820728e4fdd8b68069584c67df039b83))
* coin pair price tests ([4bbec71](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4bbec71e15e48a7ecf6b3617e58e14077e39fe79))
* fixed some errors for compilation ([8f9b4a5](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/8f9b4a5d54159422e129c7550bb48d8506d825e7))
* getMin failed when the first address was the minimum ([1e67541](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1e67541bad09128020bdd73cd6779886de6f6e7f))
* increase count of oracles in testing & rename mock contract ([881c659](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/881c659656e05d0ac7bb8ae167b17fe365d58196))
* remaining coin price tests ([e51abc9](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/e51abc95b87ebf12b4cc839e9bd09866df679dfd))
* test deposit fail in DelayMachine ([b979682](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/b979682eb4d23eff1508eb8579a5e884efe955e7))


* **oracle manager:** updated many functions with successful compilation ([0e70cb3](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/0e70cb31e03bfd4e4bce61ef60faf8404c5eb628))

## 2.0.0 (2021-04-23)


### ⚠ BREAKING CHANGES

* **oracle manager:** It will break compilation of contracts such as CoinPairPrice

### Features

* github workflows ([ea2df12](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ea2df12cd3d8b115426e9aea48243c1d6ae1cf42))
* **oracle manager:** change contract to change the min stake reqquired for oracles ([bb6b672](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/bb6b672d5bb8187308465933d2800f930be06f8e))
* add MocRegistryOracleGatherSignatureTimeoutChange change contract ([9fc55fc](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/9fc55fc0c580b02d446db1c346e52ec08f74b04e))
* **dependencies:** dependencies for 1.2.1 ([74b500e](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/74b500e553a51ef8e936f5a6ea9072d10987d6bf))
* add change contract binaries ([432e5f7](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/432e5f70f76001c2da601e131c2ebb8a19a28c70))
* change contract to get the whitelisted emergency publishers ([5bc007d](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/5bc007d15a7a8ed9a5116b43372339cb3c78933a))
* implement the new IPriceProvider interface, version bump to 1.0.1 ([023647b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/023647b4f5d94653dbd0c0b2a7f9c9802c4f39c0))
* implemented the minimum stake to subscribe, start everything in round 1 ([bfd4b3e](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/bfd4b3eddf1c9e9507f6ca84bf3fdcd31fb26b5c))
* **build:** contract binaries ([0e7018a](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/0e7018a5611f7c61c371fc56e75346549fa02852))
* **deploy:** add contract binaries ([3dff525](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3dff5255039c2ef69bc18f2b3315f8717560f251))
* **deploy:** contarct binaries ([1e57623](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1e5762367d7e268dda394e276a97c1201bfa1532))
* **deploy:** contract binaries ([7cefbe5](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/7cefbe57d0973ffcf7f938fa8b012f6a35ee496e))
* **deploy:** contract binary ([20b6323](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/20b632319a3378718fe870cfc28a8df664f45757))
* **deploy:** contract binary ([802a63b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/802a63bd4c3cb859ab16f416b92a88810270f43c))
* **deploy:** contract binary ([b13952b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/b13952bd246d02010f527284eafc5b64a43eebf9))
* **deploy:** deploy ([6d84ee0](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6d84ee097bd73e4a0d1980518ace3c7a8924a257))
* **deploy:** during deploy don't use test moc anymore, take one from config ([f764d0c](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f764d0ce03a5a1581453bdad4abc333fdbdd856a))
* **deploy:** use an external token instead of testMoc ([1c98791](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1c98791baebfb7b072eb1d1caa59da886ab28fd6))
* **staking.sol:** adds front-end calls for querying oracle list ([32ecd83](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/32ecd83971957abc197d7a3e1aa3b76eba299b89))
* **wip:** added a withdrawLockTime that is added to expiration time ([c7f4838](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c7f483899db92670dd525841000966f3df3b120f))
* **wip:** added getLockingInfo ([9c1195b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/9c1195bea80652a1183fa0a44f9e059cf347ddd5))
* **wip:** added max subscribed oracles ([0916025](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/0916025db4035bc291422285ffb1dffe68c444f9))
* **wip:** added setOracleAddress to staking machine, getters for subscribed oracles in coin pair ([c0a33a0](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c0a33a0248ff6ed81c8eb6ed466d8ed7f7810941))
* **wip:** coinPairPrice changes, use timestamp for rounds, remove canRemoveOracle ([c209e45](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c209e45327be8b3bdca9467363f9c93553c90c31))
* **wip:** contract binaries ([50e8eb3](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/50e8eb3f5a91485392f4094d6eb4fab89cfe75f9))
* **wip:** delay machine that use one source and interacts with staking machine correctly ([4b3489c](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4b3489cae9172716a6269d76578585a266d529ff))
* **wip:** don't use anymore openzeppelin/contract use upgradeables, address set lib from moc-shared ([3e6c65d](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3e6c65db8f766db565c3aaaba16d0a26731a184a))
* **wip:** implement interfaces from moc/shared, add overrides ([51e4403](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/51e44036dee9e2ce90a070bf1ddcab3cf2013b67))
* **wip:** move coin pair and oracle manager interfaces to moc/shared ([ee5c12d](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ee5c12d3c18e16928cd6c1f4bc8800df0e9175c2))
* **wip:** stacking sell/buy tokens, take just the needed amount from the user ([f56e97f](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f56e97f65b28b5b57ec2fab29bdadbecfaf11868))
* **wip:** supporters implements ISupporters ([6c19aa6](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6c19aa6a6f5939cd78d15a72a49862e003206640))
* add test for a subscription replacing another with low stake ([594c181](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/594c1819df3405040535e98ab4bf152b1cec8cc1))
* add test for InfoGetter ([81c60d4](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/81c60d433874824a098694eb41f2713d7d4945e7))
* add test to measure gas used by sort ([129d595](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/129d595396f0958d82e60025e9c03b1dfb1c6ea0))
* add tests for operations failure on OracleManager ([6fb265a](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6fb265a95d5b8e9a1f463b76836832921f68a940))
* add to withdraw from several coinPairs ([6b8a9af](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6b8a9afceff6016ce98c2e682f72f59896920450))
* add unit test for CoinPairPriceFree ([84f9430](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/84f9430b3e348ddfd23b1e4a146467fef17d2cbc))
* add unit test to simulate onWithdraw gas consumption ([9e1dc24](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/9e1dc24891936a029549e26656a4493cb9fd50e1))
* test oracle withdraw during a round ([4a79edf](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4a79edf252feb8d4b0bfd05ec22ea43e69d36a9f))
* unit test for IterableOraclesLib ([60ba016](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/60ba01603f7c17098fc9719c219bbdff3b97cba9))
* **wip:** big merge ([bc74e03](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/bc74e03c7a7e83b03acc912d035a3eaa1053e21a))
* **wip:** new set of deploy scripts, use the moc-shared configuration and scripts ([c10d675](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c10d675e60d9fcc6e1cd106dab5a359040db2e5b))
* use a single query to Supporter's contract ([ad65094](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ad65094fe3cecedce320fcf5f72e064824407a4f))
* **wip:** added the delay machine ([d2ec4e1](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d2ec4e1370c1ccefa0e3e58cbd851fe2a34de6ef))
* **wip:** oracle and CoinPair interfaces ([de4a08a](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/de4a08a7e0c1f9501a9cdf6da58b976153a48690))
* **wip:** select list based on EnumerableSet ([533c145](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/533c1456db940242ce075de143151d1f0a3a5db9))
* **wip:** some reorder in CoinPair, added a modifier to check for onlyOracleManager calls ([dcff676](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/dcff6769f987747205cc08e29650b189a3e87245))
* **wip:** use IRegistry from moc-shared ([240bd13](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/240bd13f535487bb9e16d2650a7df0214cb794da))
* sort subscribed oracles by stake ([d06eef8](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d06eef862ff2c888d2d9e2e9c33563f1f47241e0))


### Bug Fixes

* coinpair price is taking min oracles per round from the registry ([099a4ee](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/099a4ee5954d421362687d5159ce154ba62c3535))
* fix some script so the use the new npm moc-shared package ([cf3a447](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/cf3a447a64c5ade43cbe4e6743799383ff1e4a4d))
* fixed a test ([fc3cd5c](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/fc3cd5ca7549b6d6ea6447a9fa69bfa9b54026c0))
* remove editor file ([debe68b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/debe68b4d9f677d2b6418922864b2fb88394a708))
* use packages and imports from [@money-on-chain](https://github.com/money-on-chain) instead of [@moc](https://github.com/moc) ([adfdacc](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/adfdacc58eb3da9dd0cab92f6f10517d3fc72371))
* **added require to handle error:** check that lockPeriodTimestamp is higher than current time ([4dae6f4](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4dae6f4dcca77a5d8a64fdcc743e7bd767208a8d))
* **coinpair/delay machine interaction:** fixed a bug that caused the current date to be added twice ([4e83399](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4e83399fa8702cad80f5fb87cc7971fc2109bf31))
* **coinpairprice:** fixed case for withdraw with lockPeriodTimestamp 0 ([d1a33fc](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d1a33fc32e295a5ce9bc86aad27c542bc63f8387))
* **deploy:** add an empty whitelist to the initilization of the staking machine ([6f72ed1](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6f72ed15342d98402a619e44d28c8d3de67b3315))
* **interface definition:** minor changes to interface definition ([16a9778](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/16a9778ffdddf5e7c5b5fd4b52251cbd0af3194b))
* **oracle-coinpairprice contract:** fix last pub block and moved require to where it belongs to ([6a4ed8c](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6a4ed8c6b2063a2ae2f699f3dc1f04c64ca5dc4c))
* fix to audit issue moo 001 ([6df28b7](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6df28b7b6ffdf5a628157509c975b5666099f2ca))
* fix to audit issue moo 002 ([857556b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/857556b919d123a8c8f7846353854c461daa102b))
* fix to audit issue moo 003 ([6d78610](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6d7861097f97eb96599bb597a4135e212ca8dbd3))
* fix to audit issue moo 004 ([5e56e7f](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/5e56e7f12e9c0ad74ac0a37d8eb821159001c4d8))
* fix to audit issue moo 005 ([5b98751](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/5b9875194ce151ae44ce8f4bc91f107391429e92))
* fixed a bug in emergency price publish, only whitelisted no external publishing ([ebd681d](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ebd681d138d4b3f30f5c83e24259e087692f8969))
* fixed tests after merge of audit fixes ([a0783aa](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/a0783aa6e7855c20b03ff5c8d38876704e89b50b))
* **contract init params:** added new contract param to config files ([d78e975](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d78e975923404c4dfa483c0b740d94271358a285))
* **coverage:** coverage don't support modifiers inside interfaces, change to contract ([2ab9d47](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/2ab9d47b00fcaaf19bbbbdf97212e7eaf8fa6b8d))
* **coverage:** use 20 ganache account during coverage (some tests use as many) ([ea3f466](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ea3f4668f4f7f03decc07011437c7b6385ed3182))
* **deploy:** add some more gas for rsk testnet ([3c4e9e8](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3c4e9e8d214f44d384b9de7f116895e6f98f1919))
* **deploy:** added some missing contract binaries (change contracts) used during deploy ([1e71e70](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1e71e7000ab9b69c30f3c01a158427821b5f411f))
* **deploy:** change registry settings deploy step for this project ([69cbd49](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/69cbd49feaa99fe39fef212275820ad362647bf9))
* **deploy:** don't use web3 instance, instead use the package require('web3') ([ed101ca](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ed101cae999e06ca1aec7d8a207eaba0163422db))
* **deploy:** gas adjustments for rsk testnet ([f0da899](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f0da899134ca673eacb7f6adb07f62ee9f8e0380))
* **deployment:** fixed parameters for contracts deployment ([013ba32](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/013ba320bb92668eeaf0a4c44766c8e8367c9005))
* **fix:** fixed a bug in setOracleAddress ([cf8610f](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/cf8610f6db73ea2092d9fe097e6f5bb3dd6601fd))
* **lint:** linter fixes ([98b0252](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/98b02524da0fc587c8f6ad42b33bc34d054ef999))
* **oracle manager:** fixed isOwnerRegistered and isOracleRegistered functionalities ([1fa8122](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1fa81227b705db866c440b9e0d9a407dcd80649e))
* **staking:** added whitelist for Voting Machine in lockMocs() and fixed moc unlocking bug ([3e51084](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3e510846069ad5d874f0431c3bf9a239cd3314d4))
* **wip:** add a tostring to all BN used in deploy scripts ([4d899fd](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4d899fdf46413e80cd11d69854efb8b3599636d8))
* **wip:** added spdx license to delay contracts ([ad0811b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ad0811b587faa2111e1a69e62f8a05702233009b))
* **wip:** coinPairPrice tests and fixes ([f995219](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f995219daed1550ce1f8197c1db76c91174b0a80))
* **wip:** fix some missing renames from _isOwner to _isOwnerRegistered, a whitelist in OracleManager ([a6c0d43](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/a6c0d43ede08a8cfbeb4906945753d5d5252330d))
* **wip:** fix tests after replacing public variables for getters ([3ec59db](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3ec59dbea98fe91e9a4a45d3320c225afa061e3b))
* **wip:** fix tests, a bug in removeOracle ([383657b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/383657b88367fe5279e70975f5ab31585815b973))
* **wip:** fix what prettier broke ([c5ebe64](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c5ebe64d58b17c4d3b18b2b70793a6ea4d3841c0))
* **wip:** fixed a broken test ([dc50db6](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/dc50db61f436ea3c12e0c14074e448fc0e4a3071))
* **wip:** fixed a function that was commented  in InofGetter ([6ac7728](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6ac77281ed68dac1729dd3708c8063b091b5b34f))
* **wip:** getOracleOwner implementation in OracleManager ([d539346](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d539346b4bd07ec490212185d6d0bbacc3985c55))
* **wip:** implement getters for all public variables ([f2e2d39](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f2e2d397f0e866b3086f9f98acbba9885eb0ce37))
* **wip:** initialize supporters and fix some initialization order issues ([e95fe93](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/e95fe93fa91a46ec9bb5ddce71b2bbdba1d4307a))
* **wip:** let moc-shared read the dot-env .env file ([f194608](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/f19460863328259dfcb8a91b1ee00754500a9f17))
* **wip:** move lockedMocs to the storage contract ([1643374](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1643374cff8e38aec4a3928429d0f52cdd8a54b1))
* **wip:** new contract binaries ([d096635](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/d096635e1f18859debb07af14f0edb2c86d7c970))
* **wip:** optimized contract binaries ([a64ceec](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/a64ceec9e19d46476a1a14b3705b93a2c573ec11))
* **wip:** remove binaries from source repo ([60771be](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/60771be5d0e4de1cc2f93c0834c217ff44c82589))
* **wip:** staking machine now implements IStakingMachineOracles ([3867041](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/3867041eac437b7eab495267a1d67a2aed5de441))
* **wip:** supporters: Only whitelisted can lock funds ([1e71758](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1e717586ded261a59f5b99b55b26c062f62278fb))
* **wip:** use moc-shared from the tgz instead of the repo ([b740708](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/b74070801e6adc18cfa79466ba4d7a2007b29f3c))
* **withdraw:** fixed bug that made transfer to Delay while withdrawing fail ([e418f0b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/e418f0bd3cafb5ec297b33ccc6b086b17d9cfe26))
* add to onWithdraw test the case when an oracle is replaced ([72ff9ac](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/72ff9ac5566e2de98eb2c2626df0cd1e098e03b4))
* complete test for withdrawal during a round ([c287146](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/c287146298ea0c286e49f68c522f01b6f24e5d71))
* enable test for coverage ([eb9ca1b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/eb9ca1b33c37626acf1d5d986c95f805e469228e))
* misc fixes to increase coverage ([0699bcc](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/0699bcc830070714aa0f321662f2f3e256de6d5a))
* missing parameter in coinPair initialization, rename some constants to more descriptive names ([9599780](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/9599780b42e523295af07d532ee78881322a2a45))
* test title was incorrect ([526f189](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/526f18950caa6e93db2c4f1e64f3fd011aca9c66))
* **wip:** implement moc-shared IStakingMachine in StakingMachine ([4d3f73b](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4d3f73b66ff5869b6c03b4aa97f8733441a0e923))
* **wip:** iterableWhitelist based on AddressSetLib ([ebd6f98](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/ebd6f9848a49b70cb7fc88e030f1e2046e6956f5))
* **wip:** oracle manager can be only called by staking machine, check oracle addr when set ([fda1bca](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/fda1bca89ab3bbd8ce732f774d8b10f333732015))
* **wip:** registered oracles based on oz set ([83d75e6](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/83d75e6e3ca62eb21af936919c153ca8b74bd264))
* **wip:** remove a .only in a test ([8a662d2](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/8a662d29d3966ead900502d6707fb9319471a8fc))
* **wip:** remove num idle round from tests and deploy scripts ([2c1068d](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/2c1068df1408f27a47d46d80a2fa7cef85947b48))
* **wip:** remove numIdleRounds ([33d4f3a](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/33d4f3a728c37f7e6d9119d3bff181ba038799fb))
* **wip:** subscribed oracles and selected are disjoint lists, don't use the length difference ([7c4bff0](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/7c4bff0b944e74011503441371ffc53268a0bced))
* **wip:** use Governor from moc-shared in tests, added back TestMOC for now ([1020b91](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1020b91fbbac96d0becea614c4e1dc378d442376))
* **wip:** use interfaces that now are in moc-shared ([6fb24a4](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/6fb24a42820728e4fdd8b68069584c67df039b83))
* coin pair price tests ([4bbec71](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/4bbec71e15e48a7ecf6b3617e58e14077e39fe79))
* fixed some errors for compilation ([8f9b4a5](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/8f9b4a5d54159422e129c7550bb48d8506d825e7))
* getMin failed when the first address was the minimum ([1e67541](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/1e67541bad09128020bdd73cd6779886de6f6e7f))
* increase count of oracles in testing & rename mock contract ([881c659](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/881c659656e05d0ac7bb8ae167b17fe365d58196))
* remaining coin price tests ([e51abc9](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/e51abc95b87ebf12b4cc839e9bd09866df679dfd))
* test deposit fail in DelayMachine ([b979682](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/b979682eb4d23eff1508eb8579a5e884efe955e7))


* **oracle manager:** updated many functions with successful compilation ([0e70cb3](https://github.com/money-on-chain/OMoC-Decentralized-Oracle/commit/0e70cb31e03bfd4e4bce61ef60faf8404c5eb628))
