# MOC Decentralized Oracles DApp

This is a completely static web page made with React. Below are the instructions to build it using yarn nevertheless we used npm instead. 
For that reason we include here ***our*** the build instructions:

## ABI Requirements

In order to build this webpage it is required you provide files containing the contracts ABI.  

Those files are generated when the contracts are compiled prior to its deployment following these steps:

```bash
 $ cd contracts/
 $ npm install
 $ npm install -g truffle
 $ npm run build
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



===================================
# React documentation
===================================

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `yarn build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
