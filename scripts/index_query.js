const config = require('./CONFIG');
const txDecoder = require('ethereum-tx-decoder');
const colors = require('colors/safe');
const BigNumber = require('bignumber.js');
const Table = require('cli-table');
const sqlite3 = require('sqlite-async');


async function principal(conf) {
    const {web3, coinPairPrice} = conf;
    const addr = web3.utils.toChecksumAddress(process.argv[process.argv.length - 1]);
    const contract = new web3.eth.Contract(coinPairPrice.abi, addr);
    let db = await sqlite3.open('./index.db');
    const fnDecoder = new txDecoder.FunctionDecoder(coinPairPrice.abi);
    try {
        // instantiate
        const table = new Table({
            head: ["blocknumber", "message last pub block", "from", "price", "status", "gas", "gasPrice"]
        });
        const sql = "select * from blocks a, txs b where a.id = b.block_id and lower(b.`to`) = ? order by a.number desc, b.transactionIndex desc";
        const pr = (x, st, el) => (x.status ? colors.green(st) : colors.red(el || st));
        let prev = new BigNumber(0);
        await db.each(sql, addr.toLowerCase(), (err, tx) => {
            const args = fnDecoder.decodeFn(tx.input);
            if (args.signature == "switchRound()") {
                table.push([
                    pr(tx, tx.number),
                    pr(tx, "SWITCH ROUND"),
                    pr(tx, tx.from),
                    "SWITCH ROUND",
                    pr(tx, "SUCCESS", "FAILED"),
                    pr(tx, tx.gas),
                    pr(tx, tx.gasPrice),
                ]);
            } else if (args.signature == "publishPrice(uint256,bytes32,uint256,address,uint256,uint8[],bytes32[],bytes32[])") {
                table.push([
                    pr(tx, tx.number),
                    pr(tx, args.blockNumber.toString(10) + " - " + prev.sub(args.blockNumber).toString(10)),
                    pr(tx, tx.from),
                    web3.utils.fromWei(args.price.toString()),
                    pr(tx, "SUCCESS", "FAILED"),
                    pr(tx, tx.gas),
                    pr(tx, tx.gasPrice),
                ]);
                prev = args.blockNumber;
            } else {
                console.log("Invalid signature", args.signature);
            }
        });

        console.log("" + table);
    } finally {
        db.close();
    }
}


config.run(principal);
