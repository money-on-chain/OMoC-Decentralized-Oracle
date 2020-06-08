import React from 'react';
import './index.css';
import {
    Table,
    get_props,
    SC,
    Grey,
    HL,
    bigNumberifyAndFormatInt,
    formatEther,
    parseBytes32String,
    isValid,
    spantt
} from './helpers.js';
import {MyBase} from './stake.js';
import {spanColor} from "./helpers";
import {ethers} from 'ethers';


export class ContractInfo extends MyBase {
    constructor(name, parent, opts) {
        // requires opts.contract: the contract
        // optional opts.abi: to get the functions list and print-function
        super(name, parent);
        opts = opts || {};
        this.opts = opts;
        this.update = this.update.bind(this);
        this.__funcs = opts.abi ? get_props(opts.abi).map((p) => {
            return {fn: p.name}
        }) : [];
    }

    _funcs() {
        return this.__funcs;
    }

    init_state(st) {
        st[this.name] = {}
        for (let fn of this._funcs()) {
            st[this.name][fn.fn] = null;
        }
    }

    __getPF(prop) {
        if (prop.pf !== undefined) {
            return prop.pf;
        }
        if (this.opts && this.opts.pf && this.opts.pf[prop.fn]) {
            return this.opts.pf[prop.fn];
        }
        return (x) => {
            try {
                return x.toString();
            } catch (err) {
                return x;
            }
        };
    }

    dump_prop_form(state, prop) {
        let pf = this.__getPF(prop);
        let val = pf(state[prop.fn]);
        val = !val ? "" : val;
        let empty = (!val || val.length === 0) ? "empty" : "";
        return (
            <>
                <div className="form-group row">
                    <label htmlFor="{prop.fn}-input" className="col-sm-2 col-form-label">{SC(prop.fn)}</label>
                    <div className="col-sm-10">
                        <input type="string" className="form-control" id="{prop.fn}-input"
                               value={val} empty={{empty}} readOnly/>
                    </div>
                </div>
            </>
        )
    }

    decorate(value) {
        if (isValid(value)) {
            return spantt(value);
        }
        return value;
    }

    dump_prop_text(state, prop) {
        let pf = this.__getPF(prop);
        let val;
        try {
            val = pf(state[prop.fn]);
        } catch (err) {
            console.error(err)
        }
        val = !val ? "" : val;
        return (<>
            <span>{SC(prop.fn)}: </span>
            <span>{HL(this.decorate(val))}</span><br/>
        </>)
    }

    _dump(using_f, mode) {
        let state = this.get_state();
        let getdf = (prop) => (prop.display === undefined || prop.display === true) ? using_f : prop.display;
        return (<>
            {
                [{
                    fn: "Contract", pf: (x) => {
                        return this.opts.contract.address
                    }
                }]
                    .concat(this._funcs())
                    .filter((fn) => fn.display === undefined || fn.display)
                    .map(fn => getdf(fn)(state, fn))
            }
        </>)
    }

    dump() {
        return this._dump(this.dump_prop_form.bind(this), "form");
    }

    dump_text() {
        return <p className="card-text"> {Grey(this._dump(this.dump_prop_text.bind(this), "text"))}</p>
    }


    async contract_fetch(name, args) {
        let f = this.opts.contract[name];
        try {
            let rv = await f.apply(null, args);
            //console.log(name," ->", rv)
            return rv;
        } catch (err) {
            console.error("f was:", name, err)
        }
    }

    async get_prop(prop) {
        return this.contract_fetch(prop.fn);
    }

    async update() {
        let result = {};
        for (let prop of this._funcs()) {
            if (prop.get === undefined || prop.get === true) {
                let retval = await this.get_prop(prop, result);
                result[prop.fn] = retval;
                if (prop.set !== undefined) {
                    await prop.set(prop, retval, result);
                }
            }
        }
        this.setState(result);
    }
}


export class CoinPairPriceInfo extends ContractInfo {
    _funcs() {
        return [
            {fn: "getAvailableRewardFees", pf: (x) => formatEther(x)},
            {fn: "getCoinPair", pf: (x) => parseBytes32String(x)},
            {fn: "getLastPublicationBlock"},
            {fn: "getRoundInfo"},
        ];
    }
}

export class RegistryInfo extends ContractInfo {
    constructor(name, parent, opts) {
        super(name, parent, opts);
        const bn = ethers.utils.BigNumber;
        this.keys = [].concat(
            ["ORACLE_MANAGER_ADDR", "SUPPORTERS_VESTED_ADDR"]
                .map(name => ({name, func: "getAddress", procesor: (x) => x})),
            ["ORACLE_PRICE_REJECT_DELTA_PCT", "ORACLE_PRICE_FALLBACK_DELTA_PCT"]
                .map(name => ({
                    name,
                    func: "getDecimal",
                    procesor: (x) => ((new bn(x.base)).mul(new bn(10).pow(new bn(x.exp)))).toString()
                })),
            ["ORACLE_PRICE_FETCH_RATE", "ORACLE_BLOCKCHAIN_INFO_INTERVAL",
                "ORACLE_COIN_PAIR_LOOP_TASK_INTERVAL", "ORACLE_MAIN_LOOP_TASK_INTERVAL",
                "ORACLE_CONFIGURATION_TASK_INTERVAL", "ORACLE_GATHER_SIGNATURE_TIMEOUT",
                "SCHEDULER_POOL_DELAY", "SCHEDULER_ROUND_DELAY", "ORACLE_PRICE_DIGITS",
                "ORACLE_QUEUE_LEN", "MESSAGE_VERSION", "ORACLE_STAKE_LIMIT_MULTIPLICATOR",
                "ORACLE_PRICE_PUBLISH_BLOCKS", "ORACLE_PRICE_FALLBACK_BLOCKS",]
                .map(name => ({name, func: "getUint", procesor: (x) => x.toString()}))
        );
        this.result = {};
        this.__funcs = this.keys.map(p => ({fn: p.name}));
    }

    dump_prop_text(state, prop) {
        let pf = this.__getPF(prop);
        let val;
        try {
            val = pf(state[prop.fn]);
        } catch (err) {
            console.error(err)
        }
        val = !val ? "Loading..." : val;
        return (<>
            <span>{prop.fn}: </span>
            <span>{this.decorate(val)}</span><br/>
        </>)
    }


    async update() {
        for (const k of this.keys) {
            if (!this.result[k.name]) {
                const ke = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MOC_ORACLE\\1\\" + k.name));
                let val = await this.contract_fetch(k.func, [ke])
                this.result[k.name] = k.procesor(val);
            }
        }
        this.setState(this.result);
    }
}


export class SupportersInfo extends ContractInfo {
    constructor(name, parent, opts) {
        if (!opts) {
            opts = {};
        }
        if ((opts && !opts.pf)) {
            let pf = {};
            pf["totalStopBalanceInMocs"] = (x) => formatEther(x);
            opts.pf = pf;
        }
        super(name, parent, opts);
    }
}

export class SupportersWhitelist extends ContractInfo {
    constructor(name, parent, opts) {
        if (!opts) {
            opts = {};
        }
        if ((opts && !opts.pf)) {
            let pf = {};
            pf["earnings"] = (x) => formatEther(x);
            pf["mocBalance"] = (x) => formatEther(x);
            pf["mocToken"] = (x) => spantt(x);
            pf["totalSupply"] = (x) => formatEther(x);
            pf["getTokens"] = (x) => formatEther(x);
            pf["getAvailableMOC"] = (x) => formatEther(x);
            pf["getEarningsInfo"] = (x) => x ? x.map(y => y ? formatEther(y) : "").join(":") : "-";
            opts.pf = pf;
        }
        super(name, parent, opts);
    }
}


export class CoinPairPriceAllInfo extends ContractInfo {
    constructor(name, parent, opts) {
        super(name, parent, opts);
        this.selectedDisplay = this.selectedDisplay.bind(this);
        this.setRoundInfo = this.setRoundInfo.bind(this);
    }

    async get_prop(prop) {
        const cust_from = {from: "0x0000000000000000000000000000000000000001"};
        return this.contract_fetch(prop.fn, [cust_from]);
    }

    async setRoundInfo(prop, retval, result) {
        result["round"] = retval.round;
        result["startBlock"] = retval.startBlock;
        result["lockPeriod"] = retval.lockPeriodEndBlock;
        result["totalPoints"] = retval.totalPoints;
        let selected = [];
        result["selectedOracles"] = selected;

        for (let oracle of retval.selectedOracles) {
            let ret = await this.contract_fetch("getOracleRoundInfo", [oracle]);
            ret.oracle = oracle;

            let canRemoveOracle = await this.contract_fetch("canRemoveOracle", [oracle]);
            ret.canRemoveOracle = canRemoveOracle;

            selected.push(ret);
        }
    }

    dump_text() {
        return <span> {Grey(this._dump(this.dump_prop_text.bind(this), "text"))}</span>
    }

    selectedDisplay(state, prop) {
        let selected = state[prop.fn];
        const parent = this.parent;
        if (!selected) return <></>;

        return Table(["#", "oracle", "net address", "stake", "points", "sel. round", "current", "canRemoveOracle"],
            selected.map(oracle => {
                const ret = [spantt(oracle.oracle)];
                const oracle_data = parent._get_oracle(oracle.oracle);
                if (oracle_data === null) {
                    ret.push(HL(""));
                    ret.push(HL(""));
                } else {
                    ret.push(HL(oracle_data["ns"]));
                    ret.push(HL(ethers.utils.formatEther(oracle_data["stake"])));
                }
                return ret.concat([HL(bigNumberifyAndFormatInt(oracle.points)),
                    HL(bigNumberifyAndFormatInt(oracle.selectedInRound)),
                    HL(oracle.selectedInCurrentRound ? "yes" : "no"),
                    HL(oracle.canRemoveOracle ? "yes" : "no"),
                ]);
            }), {
                nonresponsive: true,
                row2ttf: (row) => parent.oracle_info(row.oracle),
                odata: selected,
                classes: "table-hover"
            }
        );
    }

    _funcs() {
        return [
            {fn: "getAvailableRewardFees", pf: (x) => formatEther(x)},
            {
                fn: "peek", pf: (x) => {
                    if (!x) {
                        return formatEther(x)
                    }
                    return spanColor(formatEther(x[0]), x[1] ? "#00d717" : "#cc3300")
                }
            },
            {fn: "getCoinPair", pf: (x) => parseBytes32String(x)},
            {fn: "getLastPublicationBlock"},

            {fn: "getRoundInfo", display: false, set: this.setRoundInfo},

            {fn: "startBlock", get: false},
            {fn: "round", get: false},
            {fn: "lockPeriod", get: false},
            {fn: "totalPoints", get: false},
            {fn: "selectedOracles", get: false, display: this.selectedDisplay},
        ];
    }
}

