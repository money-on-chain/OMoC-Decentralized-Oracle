/*
This script queries the OracleManager for all the CoinPairPrice addresses then
    the block chain is searched for call to those contracts and transaction details are shown.
    Example: ```NETWORK=ganche node lastPubBlock.js 0xE2e9570d9f3E63Ca1b6dAf7D0966C5dC151b03DF```

 */
const DEPTH_IN_BLOCKS = process.argv[2] ? parseInt(process.argv[2]) : 70;
const config = require('./CONFIG');
const helpers = require('./helpers');
const txDecoder = require('ethereum-tx-decoder');
const colors = require('colors/safe');
const BigNumber = require('bignumber.js');
const Table = require('cli-table');

async function getHistory(web3, fromBlk, toBlk, to) {
    const eth = web3.eth;
    const range = [...Array(toBlk - fromBlk + 1).keys()].map(i => i + fromBlk);
    const blocks = await Promise.all(range.map(i => eth.getBlock(i, true)));
    const f_blocks = blocks.filter(b => b != null && b.transactions != null)
        .map(b => b.transactions.map(x => ({...x, timestamp: b.timestamp})));
    const txs = [].concat.apply([], f_blocks)
        .filter(tx => tx.to && tx.to.toLowerCase() == to.toLowerCase());
    const txMap = txs.reduce((acc, tx) => {
        acc[tx.hash] = tx;
        return acc;
    }, {});
    const receipts = await Promise.all(txs.map(x => eth.getTransactionReceipt(x.hash)));
    receipts.sort((a, b) => (b.blockNumber - a.blockNumber));
    return receipts.map(r => ({...r, ...txMap[r.transactionHash]}));
}

async function historyForCoinPair(web3, abi, contract) {
    const fnDecoder = new txDecoder.FunctionDecoder(abi);
    const lastPubBlock = parseInt(await contract.methods.getLastPublicationBlock().call());
    const currentBlock = parseInt(await web3.eth.getBlockNumber());
    const startBlockNumber = Math.max(0, lastPubBlock - DEPTH_IN_BLOCKS);
    const endBlockNumber = Math.min(currentBlock, lastPubBlock + DEPTH_IN_BLOCKS);
    console.log("-".repeat(10), colors.green("current block " + currentBlock
        + " last pub block " + lastPubBlock
        + " search txs from " + startBlockNumber + " to " + endBlockNumber
    ));
    const txs = await getHistory(web3, startBlockNumber, endBlockNumber, contract.options.address);
    const pr = (x, st, el) => (x.status ? colors.green(st) : colors.red(el || st));
    // instantiate
    const table = new Table({
        head: ["timestamp", "blocknumber", "message last pub block", "from", "price", "status"]
    });
    let prev = new BigNumber(endBlockNumber.toString());
    txs.forEach(x => {
        const args = fnDecoder.decodeFn(x.input);
        const d = new Date(x.timestamp * 1000).toISOString();
        if (args.signature == "switchRound()") {
            table.push([
                pr(x, d),
                pr(x, x.blockNumber),
                pr(x, "SWITCH ROUND"),
                pr(x, x.from),
                "SWITCH ROUND",
                pr(x, "SUCCESS", "FAILED"),
            ]);
        } else if (args.signature == "publishPrice(uint256,bytes32,uint256,address,uint256,uint8[],bytes32[],bytes32[])") {
            table.push([
                pr(x, d),
                pr(x, x.blockNumber),
                pr(x, args.blockNumber.toString(10) + " - " + prev.sub(args.blockNumber).toString(10)),
                pr(x, x.from),
                web3.utils.fromWei(args.price.toString()),
                pr(x, "SUCCESS", "FAILED"),
            ]);
            prev = args.blockNumber;
        } else {
            console.log("Invalid signature", args.signature);
        }
    });
    console.log("" + table);
}

async function principal(conf) {
    const {web3, coinPairPrice, oracleManager} = conf;
    const cprMethods = oracleManager.contract.methods;
    const coinCant = await cprMethods.getCoinPairCount().call();
    for (let i = 0; i < coinCant; i++) {
        const coinPair = await cprMethods.getCoinPairAtIndex(i).call();
        const addr = await cprMethods.getContractAddress(coinPair).call();
        console.log("-".repeat(20), colors.green(helpers.coinPairStr(coinPair) + " -> " + addr));
        coinPairPrice.contract.options.address = addr;
        await historyForCoinPair(web3, coinPairPrice.abi, coinPairPrice.contract);
    }
}

config.run(principal);
