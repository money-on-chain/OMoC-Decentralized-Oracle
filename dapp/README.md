# MOC Decentralized Oracles DApp

This is a completely static web page made with React. Below are the instructions to build it using yarn nevertheless we used npm instead. 
For that reason we include here ***our*** the build instructions:

## ABI Requirements

In order to build this webpage it is required you provide files containing the contracts ABI.  

Those files are generated when the contracts are compiled prior to its deployment. To build the contracts follow the instructions on [contracts/README.md](../contracts/README.md) and then copy them to the DAPP src folder:

```bash
 $ cd contracts/
 $ cp -r build/contracts ../dapp/src   # install contracts in DApp.
```

## DApp configuration

The address of the deployed contracts is required for the DApp to work.
Configure them and a few extra parameters in the `/dapps/.env.production` file:

```env
REACT_APP_CoinPairRegister=0xe8E262d96527DFd134E49CFe05E41D5025d478a1
REACT_APP_OracleManager=0x3069fA76ca28f421A6dd5Da66CF0F6e52ba18cb7
REACT_APP_SupportersVested=0x01927D8715E537b505f9DC58Ad5Ea31D74b6D64B
REACT_APP_SupportersWhitelisted=0xc03AC4b321eb1f2263869565e6754B782e3da536
REACT_APP_NetworkID=30
REACT_APP_AllowMint=false
```

Extra parameters:

 * `REACT_APP_NetworkID`: The blockchain network ID. Use 31 for RSK testnet and 30 for RSK mainnet.
 * `REACT_APP_AllowMint`: This is a parameter for internal testing which enables token minting in a debug environment. Set it to *false* .


## Build the *DApp* 

All required to build the `DApp` is available now. Build it with:

```bash
 $ cd dapp/
 $ npm install
 $ npm run build
```

 The statically made resulting webpage will be included in output directory `dapp/build`.

Notes:

 * depending on the react and webpack versions you are using, you may encounter some incompatibility problems. Follow react/webpack instructions or fallback to this to generate a build or execute:

 ```bash
 SKIP_PREFLIGHT_CHECK=true npm run build
 ```

## This project uses React

You can read the project's react documentation at [README_React.md](./README_React.md).
