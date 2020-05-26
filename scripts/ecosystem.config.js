module.exports = {
    apps: [{
        name: "indexer",
        script: "./index_contract_calls.js",
        watch: false,
        autorestart: false,
        args: "PUT YOUR COIN PAIR PRICE ADDR HERE!!!",
        cron_restart: "0,30 * * * *",
        log_date_format: "YYYY-MM-DD HH:mm:ss Z",
        env: {
            NETWORK: 'rsknode_gobernanza'
        },
    }]
}
