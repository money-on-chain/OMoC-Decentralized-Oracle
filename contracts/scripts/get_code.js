'use strict';
global.artifacts = artifacts;
global.web3 = web3;


async function main() {
    const addr = web3.utils.toChecksumAddress(process.argv[process.argv.length - 1]);
    const code = await web3.eth.getCode(addr);
    console.log("CODE:", code)
    console.log("SHA3:", web3.utils.sha3(code));
}

// For truffle exec
module.exports = function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};

