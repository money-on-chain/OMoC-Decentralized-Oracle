const config = require('./CONFIG');
const helpers = require('./helpers');
const {time} = require("@openzeppelin/test-helpers")


// account6

async function process(web3, token, supporters, account6, quantity) {
    const supportersMethods = supporters.contract.methods;
    const totalSupply = await supportersMethods.totalSupply().call();
    if (totalSupply <= 0) {
        console.log("There are no supporters, wait...");
        await time.advanceBlock();
        return 2;
    }
    while (!(await supportersMethods.isReadyToDistribute().call())) {
        const endEarnings = await supportersMethods.endEarnings().call();
        const blockNumber = await web3.eth.getBlockNumber();
        console.log("The round is running, mine blocks ", endEarnings, blockNumber);
        await time.advanceBlock();
        return 1;
    }
    console.log("distribute and add fees");
    await supportersMethods.distribute().send({from: account6})
    await token.methods.mint(account6, quantity).send({from: account6})
    await token.methods.transfer(supporters.addr, quantity).send({from: account6})
    return 1;
}

async function principal(conf) {
    const {web3, supporters, token} = conf;
    const mocTokenAddr = await supporters.contract.methods.mocToken().call();
    token.contract.options.address = mocTokenAddr;
    const accounts = await web3.eth.getAccounts();
    while (true) {
        const secs = await process(web3, token.contract, supporters, accounts[0], 10 ** 15)
        await helpers.sleep(secs * 1000);
    }
}

config.run(principal);
