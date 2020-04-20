/*
This is a basic blockchain indexer that saves transactions sent to a specific
    smart contract address that must be passed as argument. It saves the results to a sqlite database (index.db)
    the saved information is processes later with the index_query.js script.
    Example: ```NETWORK=ganche node index_contract_calls.js 0xE2e9570d9f3E63Ca1b6dAf7D0966C5dC151b03DF```
 */
const config = require('./CONFIG');
const txDecoder = require('ethereum-tx-decoder');
const sqlite3 = require('sqlite-async');


const TABLES = {
    txs: {
        id: "integer primary key",
        block_id: "integer not null",
        transactionHash: "text collate nocase",
        transactionIndex: "integer",
        cumulativeGasUsed: "integer",
        gasUsed: "integer",
        contractAddress: "text collate nocase",
        from: "text collate nocase",
        to: "text collate nocase",
        root: "text collate nocase",
        status: "boolean",
        logsBloom: "text collate nocase",
        logs: "text collate nocase",
        hash: "text collate nocase",
        nonce: "integer",
        gas: "integer",
        gasPrice: "text collate nocase",
        value: "text collate nocase",
        input: "text collate nocase",
    },
    blocks: {
        id: "integer primary key",
        hash: "text collate nocase not null unique",
        parentHash: "text collate nocase",
        number: "integer not null",
        sha3Uncles: "text collate nocase",
        logsBloom: "text collate nocase",
        miner: "text collate nocase",
        difficulty: "text collate nocase",
        totalDifficulty: "text collate nocase",
        extraData: "text collate nocase",
        size: "integer",
        gasLimit: "integer",
        gasUsed: "integer",
        timestamp: "integer",
        minimumGasPrice: "text collate nocase",
        bitcoinMergedMiningHeader: "text collate nocase",
        bitcoinMergedMiningCoinbaseTransaction: "text collate nocase",
        bitcoinMergedMiningMerkleProof: "text collate nocase",
        hashForMergedMining: "text collate nocase",
        paidFees: "text collate nocase",
    },
    blockchain_head: {
        id: "integer primary key",
        hash: "text collate nocase not null unique",
        number: "integer not null",
    },
};

async function getTransactions(web3, blk, to) {
    const block = await web3.eth.getBlock(blk.hash, true);
    const txs = block.transactions.filter(tx => ((tx.to == null)
        || (tx.to && tx.to.toLowerCase() == to.toLowerCase())));
    if (txs.length == 0) {
        return [];
    }
    const txMap = txs.reduce((acc, tx) => {
        acc[tx.hash] = tx;
        return acc;
    }, {});
    const receipts = await Promise.all(txs.map(x => web3.eth.getTransactionReceipt(x.hash)));
    receipts.sort((a, b) => (b.blockNumber - a.blockNumber));
    const ret = receipts.map(r => ({...r, ...txMap[r.transactionHash]}))
        .filter(tx => (tx.to && tx.to.toLowerCase() == to.toLowerCase())
            || (tx.contractAddress && tx.contractAddress.toLowerCase() == to.toLowerCase()))
        .map(x => ({...x, logs: JSON.stringify(x.logs)}));
    return ret;
}


async function create_tables(db) {
    for (const t of Object.keys(TABLES)) {
        const t_info = TABLES[t];
        const field_desc = Object.keys(t_info).map(x => ("`" + x + "`" + " " + t_info[x]));
        const fields = field_desc.join(", ");
        const sql = `CREATE TABLE IF NOT EXISTS ${t} ( ${fields} );`;
        await db.run(sql);
    }
    await db.run("CREATE INDEX IF NOT EXISTS txs_by_block on txs (block_id);");
    await db.run("CREATE INDEX IF NOT EXISTS blocks_by_hash on blocks (hash);");
    await db.run("CREATE INDEX IF NOT EXISTS blocks_by_number on blocks (number);");
}


async function insert_in_table(db, table_name, data, nullables = new Set([])) {
    const col_names = Object.keys(TABLES[table_name]).filter(x => x != "id");
    const values = col_names.map(x => data[x]);
    // TODO: Remove
    const missing = col_names.filter(x => (!nullables.has(x) && !(x in data)))
    if (missing.length != 0) {
        console.log("There are missing values:", table_name, missing, data);
        process.exit();
    }
    //
    const escaped = col_names.map(x => "`" + x + "`");
    const sql = `insert into ${table_name} (${escaped.join(", ")}) values (${col_names.map(x => "?").join(",")})`;
    return await db.run(sql, values);
}

async function get_next_block_to_process(db, hash, creation_block) {
    let is_processed = await db.get('select hash,parentHash,number from blocks where hash = ?', hash);
    if (!is_processed) {
        return hash;
    }
    while (true) {
        console.log("Already processed block", is_processed.hash, is_processed.number);
        const block = await db.get('select hash,parentHash,number from blocks where hash = ?', is_processed.parentHash);
        if (!block) {
            return is_processed.parentHash;
        }
        if (creation_block && creation_block.number >= block.number) {
            return null;
        }
        is_processed = block;
    }
}

async function purge_head(web3, db, currentBlock, head) {
    console.log("Purge head", head.hash, head.id, head.number);
    let current = head;
    while (true) {
        const in_blockchain = await web3.eth.getBlock(current.number, false);
        if (current.hash == in_blockchain.hash) {
            // Found in the blockchain, if it is confirmed we can delete it
            if ((currentBlock.number - head.number) > 100) {
                await db.run("delete from blockchain_head where id = ?;", head.id);
            }
            return;
        }
        const block = await db.get('select id,hash,parentHash,number from blocks where hash = ?', current.hash);
        console.log("Purge head", head.hash, head.id, head.number, "delete entries");
        await db.run("delete from txs where block_id = ?;", block.id);
        await db.run("delete from blocks where id = ?;", block.id);
        current = await db.get('select id,hash,parentHash,number from blocks where hash = ?', block.parentHash);
    }
}

async function principal_with_db(web3, db, addr) {
    const heads = await db.all("select * from blockchain_head");
    const currentBlock = await web3.eth.getBlock(await web3.eth.getBlockNumber(), false);
    if (!heads.some(x => x.hash == currentBlock.hash)) {
        await insert_in_table(db, "blockchain_head", currentBlock);
    }

    for (const h of heads) {
        await db.run('BEGIN TRANSACTION;');
        await purge_head(web3, db, currentBlock, h);
        await db.run('COMMIT TRANSACTION;');
    }

    let creation_block = await db.get('select hash,parentHash,number from blocks '
        + 'where id in (select block_id from txs where contractAddress = ?)', addr);

    let created = false;
    for (let block = currentBlock;
         block.hash != "0x" + "0" * 40 && !created;
         block = await web3.eth.getBlock(block.parentHash, false)) {

        const next_hash = await get_next_block_to_process(db, block.hash, creation_block);
        if (next_hash === null) { // creation block
            console.log("Found contract creation block", creation_block.hash, creation_block.number);
            return;
        }
        if (next_hash != block.hash) {
            block = await web3.eth.getBlock(next_hash, false);
        }


        console.log("process block", block.hash, block.number);
        await db.run('BEGIN TRANSACTION;');
        const blk_row = await insert_in_table(db, "blocks", block,
            new Set(["minimumGasPrice",
                "bitcoinMergedMiningHeader",
                "bitcoinMergedMiningCoinbaseTransaction",
                "bitcoinMergedMiningMerkleProof",
                "hashForMergedMining"]));
        if (block.transactions.length != 0) {
            const txs = await getTransactions(web3, block, addr);
            for (const tx of txs) {
                const data = {block_id: blk_row.lastID, ...tx};
                await insert_in_table(db, "txs", data);
                if (tx.contractAddress == addr) {
                    // contract creation transaction => stop
                    console.log("Found contract creation transaction", tx.hash,
                        "in block", block.hash, block.number);
                    created = true;
                }
            }
        }
        await db.run('COMMIT TRANSACTION;');
    }
}

async function principal(conf) {
    const {web3} = conf;
    const addr = web3.utils.toChecksumAddress(process.argv[process.argv.length - 1]);
    let db = await sqlite3.open('./index.db');
    try {
        await create_tables(db);
        await principal_with_db(web3, db, addr);
    } finally {
        db.close();
    }
}


config.run(principal);
