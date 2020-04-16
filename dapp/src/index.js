import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import {ethers} from 'ethers';
import * as TOKEN_DATA from './contracts/TestMOC.json';
import * as CONTRACT_DATA from './contracts/OracleManager.json';
import * as CPP_DATA from './contracts/CoinPairPrice.json';
import * as SUPVESTCPP_DATA from './contracts/SupportersVested.json';
import * as SUPLISTCPP_DATA from './contracts/SupportersWhitelisted.json';
import {OracleStake, SupportersStake} from './stake.js';
import {
    addreq,
    align_center,
    align_left,
    align_right,
    formatEther,
    getTimeout,
    Grey,
    HL,
    isValid,
    isValidNS,
    M,
    naive_copy,
    on_tx_err,
    on_tx_ok,
    spantt,
    Table
} from './helpers.js';
import {CoinPairPriceAllInfo, SupportersInfo, SupportersWhitelist} from "./contractinfo.js";
import {close, edit, save, spinner, trash} from "./icons";
import {getBalance, in_, is_empty_obj, null_href, Tabs} from "./helpers";

const SUPLISTCPP_ABI = SUPLISTCPP_DATA["abi"];
const SUPPORTERS_VESTED_ABI = SUPVESTCPP_DATA["abi"];
const CPP_ABI = CPP_DATA["abi"];
const TOKEN_ABI = TOKEN_DATA["abi"];
const CONTRACT_ABI = CONTRACT_DATA["abi"];


const SUPPORTERS_VESTED_ADDR = process.env.REACT_APP_SupportersVested;
const CONTRACT_ADDR = process.env.REACT_APP_OracleManager;
const NETWORK = process.env.REACT_APP_NetworkID;
const SUPLISTCPP_ADDR = process.env.REACT_APP_SupportersWhitelisted;

const ICONS_ALWAYS = true;


function get_networks() {
    let nets = [];
    let obj = CONTRACT_DATA["networks"];
    for (let prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            nets.push(prop);
        }
    }
    return nets;
}

const OracleColumns = ["#", "owner", "address", "net address", "stake", "pairs", "rounds", "gas"];

async function new_iaddr(contract, oracle_addr, iaddr, cb) {
    if (!isValid(oracle_addr) || !isValidNS(iaddr)) {
        return alert("Invalid address!");
    }
    try {
        let tx = await contract.setOracleName(oracle_addr, iaddr, M());
        if (cb) {
            cb();
        }
        return await on_tx_ok(tx, "oracle net-address change");
    } catch (err) {
        on_tx_err(err, "oracle net-address change");
    }
}


class Console extends React.Component {
    do_disconnect() {
        this.setState({
            connected: false,
        });
    }

    do_connect(accounts, network) {
        const self = this;
        this.web3Provider = new ethers.providers.Web3Provider(window.web3.currentProvider);
        this.signer = this.web3Provider.getSigner();
        this.oracle_mgr = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, this.signer);
        const ethereum = window['ethereum'];

        const sup_vest_contract = new ethers.Contract(SUPPORTERS_VESTED_ADDR, SUPPORTERS_VESTED_ABI, this.signer);
        this.suplist = new ethers.Contract(SUPLISTCPP_ADDR, SUPLISTCPP_ABI, this.signer);

        this.c_suplist = new SupportersWhitelist("supp_wlist_", this, {contract: this.suplist, abi: SUPLISTCPP_ABI});


        ethereum.on('accountsChanged', function (accounts) {
            self.do_connect(accounts, network);
        });

        ethereum.on('networkChanged', function (newnet) {
            this.setState({
                mmNetwork: newnet,
            }, () => {
                self.do_connect(accounts, newnet);
            });
        });


        this.sup_stake = new SupportersStake("sup__", this, sup_vest_contract, "Supporters");
        this.mgr_stake = new OracleStake("mgr__", this, this.oracle_mgr, "Oracle Manager");
        this.sup_info = new SupportersInfo("supp_info__", this, {
            contract: sup_vest_contract,
            abi: SUPPORTERS_VESTED_ABI
        });

        this.setState({
            connected: true,
            network: network,
            mmNetwork: ethereum.networkVersion,
            address: accounts[0],  // the only one
        }, () => {
            this.to = setInterval(() => {
                self._update()
            }, getTimeout());
        });
    }

    get_state() {
        return this.state;
    }

    metamask_ok() {
        let eth = window['ethereum'];
        return eth !== undefined && eth !== null;
    }

    constructor(props) {
        super(props);
        this.in_update = false;

        this.state = {
            metamask_ok: this.metamask_ok(),
            connected: false,
            minOracleOwnerStake: null,
            mgr_token_addr: null,
            cp: null,
            address: "",
            //temp
            latestblock: null,
            blocknr: "(fetching)",
            tokenBalance: null,
            //tabs
            current_tab: "Oracles",
            //supporters vested
            supp_vested_ct_props: {},
            // stake
            sup_stake: null,
            mgr_stake: null,
            // oracle Table
            ot_last_idx: null,
            // edit ns
            temp_ns: null,
            temp_stake: null,
            temp_oracle: {},
            temp_updating: {},  // address: message  (while updating)
        };
        this.cp_comps = {};
        this.contracts = {};
        this._register_update = this._register_update.bind(this);
        this._manager_update = this._manager_update.bind(this);
        this.new_coinpairs = this.new_coinpairs.bind(this);
        this.ot_row_attrs = this.ot_row_attrs.bind(this);
        this.oracle_to_table = this.oracle_to_table.bind(this);
        this.oracle_to_table2 = this.oracle_to_table2.bind(this);

        this.oracle_mgr = null;
        this.sup_stake = null;
        this.sup_info = null;
        this.mgr_stake = null;
        this.suplist = null;
        this.c_suplist = null;
        this.web3Provider = null;
        this.signer = null;
        this.token = null;
        this.provider = null;

        (new SupportersStake("sup__", this)).init_state(this.state);
        (new OracleStake("mgr__", this)).init_state(this.state);
        (new SupportersInfo("supp_info__", this)).init_state(this.state);
        (new SupportersInfo("supp_wlist_", this)).init_state(this.state);

        this._manager_init(this.state);
        this._update();
    }

    componentDidUpdate() {
        //window.$('[data-toggle="tooltip"]').tooltip({html: true});
    }

    componentDidMount() {
        if (this.metamask_ok()) {
            const ethereum = window['ethereum'];
            ethereum.enable().then((accounts) => {
                this.do_connect(accounts, NETWORK);
            }).catch(console.error);
        }
        //window.$('[data-toggle="tooltip"]').tooltip({html: true});
    }

    async fetch_cpr_data() {
        let cpr = this.oracle_mgr;
        let data = [];
        let pairs = await cpr.getCoinPairCount();
        let et = ethers.utils.bigNumberify(pairs);
        pairs = parseInt(et);
        if (pairs === 0) {
            console.warn("There seems to be no coinpairs registered!");
        } else {
            console.log(`There are ${pairs} coinpairs registered!`);
        }
        try {
            for (let idx = 0; idx < pairs; idx++) {
                let cp = await cpr.getCoinPairAtIndex(idx);
                let cp_addr = await cpr.getContractAddress(cp);
                data.push({
                    pair: ethers.utils.parseBytes32String(cp),
                    raw: cp,
                    address: cp_addr
                });
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
        if (data.length === 0) {
            data = null
        }
        return {
            cp: data
        }
    }

    async getBlock() {
        return new Promise((resolve, reject) => {
            try {
                window.web3.eth.getBlock("latest", (err, blocknr) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(blocknr);
                });
            } catch (err) {
                reject(err);
            }
        })
    }

    async _register_update() {
        let cpr_cp;
        let newst = {};
        const pre_state = this.is_init_complete();
        let continue_fetch = true;
        try {
            let block = await this.getBlock();
            newst.blocknr = block.number;
            newst.lastblock = block;
            continue_fetch = (!pre_state) || (this.state.lastblock.hash!==block.hash);

            if (this.state.minOracleOwnerStake===null) {
                newst.minOracleOwnerStake = await this.oracle_mgr.minOracleOwnerStake();
            }
            if (this.state.mgr_token_addr === null) {
                newst.mgr_token_addr = await this.oracle_mgr.token();
                this.token = new ethers.Contract(newst.mgr_token_addr,
                                                 TOKEN_ABI, this.signer);
            }
        } catch (err) {
            console.error(1, err);
            throw err;
        }

        if (this.state.cp === null) {
            cpr_cp = await this.fetch_cpr_data();
            if (cpr_cp.cp) {
                newst.cp = cpr_cp.cp;
                this.setState(newst, () =>
                    this.new_coinpairs(cpr_cp.cp));
                return true;
            }
        }
        this.setState(newst);
        return continue_fetch;
    }

    is_init_complete() {
        let varsok = (!is_empty_obj(this.contracts)) && (!is_empty_obj(this.cp_comps))
        return (-1===[this.state.cp, this.state.minOracleOwnerStake,
                this.token].indexOf(null) && varsok)
    }

    new_coinpairs(cps) {
        let comps = {};
        let st = {};
        let contracts = {};

        for (let cp of cps) {
            let pair = cp.pair;
            contracts[pair] = new ethers.Contract(cp.address, CPP_ABI, this.signer);
            let comp = new CoinPairPriceAllInfo("cp_" + pair + "__", this, {contract: contracts[pair]});
            comp.init_state(st);
            comps[cp.pair] = comp;
        }

        this.setState(st, () => {
            this.contracts = contracts;
            this.cp_comps = comps;
        });
    }

    get_coinpairs() {
        return this.state.cp ? this.state.cp : [];
    }

    get_coinpairs_ready() {
        return this.state.cp ? this.state.cp.filter(
                            cp => this.cp_comps[cp.pair]) : [];
    }

    async _get_cp_oracle_data(oracle, pair) {
        let subscribed = await this.oracle_mgr.isSuscribed(oracle, pair.raw);
        if (!subscribed) {
            return null;
        }
        return await this.oracle_mgr.getOracleRoundInfo(oracle, pair.raw);
    }

    async _manager_update() {
        let oracle_reg_info = [];
        let cp = this.get_coinpairs();
        let current = await this.oracle_mgr.getRegisteredOracleHead();
        while (current !== "0x0000000000000000000000000000000000000000") {
            let oc = await this._get_oracle_info(current, cp);
            oracle_reg_info.push(oc);
            current = await this.oracle_mgr.getRegisteredOracleNext(current);
        }
        this.setState({
            mgr_oracle_reg_info: oracle_reg_info
        });

        let copy = naive_copy(oracle_reg_info);
        for (let oc of copy) {
            // const provider = window.ethereum;
            // const balance = await provider.eth_getBalance(oc.address);
            const balance = await getBalance(oc.address);
            oc.gas = balance;
        }
        this.setState({
            mgr_oracle_reg_info: copy
        });
    }

    async _get_oracle_info(address, cp) {
        if (!cp) {
            cp = this.get_coinpairs();
        }
        let pairs = [];
        let allinfo = {};
        for (let pair of cp) {
            let info = await this._get_cp_oracle_data(address, pair);
            if (info !== null) {
                pairs.push(pair.pair);
                allinfo[pair.pair] = info;
            }
        }
        let x = await this.oracle_mgr.getOracleRegistrationInfo(address);
        return {
            address,
            ns: x[0],
            stake: x[1],
            owner: x[2],
            roundinfo: allinfo,
            gas: null,
            pairs
        };
    }

    _manager_init(st) {
        st["mgr_oracle_reg_info"] = [];
    }

    async global_update() {
        if (this.token!==null) {
            let tokenBalance = await this.token.balanceOf(
                                        this.state.address);
            this.setState({tokenBalance});
        }
    }

    async _a_update() {
        this.global_update = this.global_update.bind(this);

        let fs = [
            {f: this.global_update, n:"global update"},
            {f: this._manager_update, n: "manager update"},
        ].concat((this.mgr_stake ? {f: this.mgr_stake.update, n: "mgr"} : []))
        .concat((this.sup_stake ? {f: this.sup_stake.update, n: "sup"} : []))
        .concat((this.c_suplist ? {f: this.c_suplist.update, n: "sup whitelist"} : []))
        .concat((this.sup_info ? {f: this.sup_info.update, n: "supportersinfo"} : [])
        );

        let new_block = await this._register_update();
        if (!new_block) {
            console.log(new Date()+"+update skipped no new block.")
        } else {
            for (let cp of this.get_coinpairs()) {
                const comp = this.cp_comps[cp.pair];
                if (comp) {
                    fs = fs.concat({f: comp.update, n: "comp-" + cp.pair});
                }
            }

            for (let f of fs) {
                try {
                    console.log(new Date()+" -- "+f.n+"          //");
                    await f.f();
                } catch (err) {
                    console.error(`Error: ${f.n} failed!!!! `);
                    console.error(err);
                }
            }
        }
    }

    _update() {
        let metamask_ok = this.metamask_ok();
        if (metamask_ok !== this.state.metamask_ok) {
            this.setState({metamask_ok});
        }
        if (!this.state.connected) {
            return;
        }
        if (!this.in_update) {
            console.log(new Date()+"update started..");
            this.in_update = true;
            this._a_update()
                .then((ret) => {
                    console.log(new Date()+"+update ended")
                    this.in_update = false
                })
                .catch((err) => {
                    console.log(new Date()+"+update exception")
                    console.error(2, err);
                    this.in_update = false;
                });
        }
    }

    waitTx(hash) {
        console.log("asking for tx: " + hash);
        let tx = this.provider.eth_getTransactionByHash(hash);
        if (tx.blockNumber === null) {
            setTimeout(() => this.waitTx(hash), 500)
        } else {
            console.log("wait for tx: " + hash + " ended!");
        }
    }

    // newinfo---------------------------------------------------------
    switch_round(e, pair) {
        e.preventDefault();
        let contract = this.contracts[pair];
        if (!contract) {
            alert(`Contract for ${pair} isn't loaded yet. Please retry in a few seconds.`);
            return;
        }
        contract.switchRound(M())
            .then((tx) => on_tx_ok(tx, "switch round: " + pair))
            .catch(err => on_tx_err(err, "switch round: " + pair))
    }

    distribute(e) {
        e.preventDefault();
        let contract = this.suplist;
        contract.distribute(M())
            .then((tx) => on_tx_ok(tx, "distribute"))
            .catch(err => on_tx_err(err, "distribute"))
    }

    get_cp_name_address_switch(short) {
        let pre = "";
        let mapf;
        if (!short) {
            short = false;
            pre = <>
                minOracleOwnerStake: {formatEther(this.state.minOracleOwnerStake)} tokens <br/>
                mgr_token_addr: {this.state.mgr_token_addr} <br/>
                <h6> pairs </h6>
            </>
        }

        let heads = short? ["Pair", ""] : ["Pair", "Address", ""];
        if (short) {
            mapf = (x) => [x.pair,
                        this.button("switch round", (e) => this.switch_round(e, x.pair))]
        } else {
            mapf = (x) => [x.pair, spantt(x.address), this.button("switch round",
                                                                        (e) => this.switch_round(e, x.pair))]
        }

        return this.XCard(6,
            <>  {pre}
                {Table(heads, this.get_coinpairs().map(mapf), {
                            nonresponsive: true,
                            classes: "table-sm  .w-auto",
                            incidx: false
                        })
                }
                <div className="d-flex justify-content-between align-items-center">
                    <div className="btn-group">
                        <button type="button" className="btn btn-sm btn-outline-secondary"
                                onClick={(e) => this.distribute(e)}>Distribute
                        </button>
                    </div>
                </div>
            </>,
            "Coin pairs");
    }

    get_cp_short() {
        return this.get_cp_name_address_switch(true);
    }


    // cards functions ------------------------------------------------
    button_group(X) {
        return (
            <div className="d-flex justify-content-between align-items-center">
                {X}
            </div>)
    }

    button(text, cb) {
        return (
            <div className="btn-group">
                <button type="button" className="btn btn-sm btn-outline-secondary"
                        onClick={cb}>{text}
                </button>
            </div>);
    }

    _get_oracle(addr) {
        addr = addr.toLowerCase();
        for (let oracle of this.state.mgr_oracle_reg_info) {
            if (oracle.address.toLowerCase() === addr) {
                return oracle;
            }
        }
        return null;
    }

    oracle_info(oracle_addr) {
        if (!oracle_addr || !(this.state.mgr_oracle_reg_info))
            return <></>;

        const oracle = this._get_oracle(oracle_addr);
        if (oracle === null) {
            return <><span>(loading..)</span></>;
        }

        return Table(["", `Oracle ${oracle_addr} info`], this.oracle_to_table(oracle).map(
                                                                    (field, idx) => [OracleColumns.slice(1)[idx], field]
        ), {nonresponsive: true, classes: " table-dark ", incidx: false});
    }

    global_info() {
        return <>
            {this.XCard(6,
                <p className="card-text"> {Grey(<>
                    Current block: {HL(this.state.blocknr)}.
                    Your address is: {spantt(this.state.address)}.
                    Current (on chain) balance: {HL(formatEther(this.state.tokenBalance))} tokens.
                </>)}
                </p>, "")}

        </>;
    }

    network_connect() {
        return this.card(
            get_networks().map(netid => (
                <button key={netid} onClick={(e) => {
                    const ethereum = window['ethereum'];
                    ethereum.enable().then((accounts) => {
                        this.do_connect(accounts, netid);
                    }).catch((err) => console.error(err));
                }}>Connect to metamask - net {netid}</button>
            )), "Network");
    }

    network_disconnect() {
        return this.card(
            <>
                {this.state.mmNetwork !== this.state.network ? <>
                    <span style={{color: "red"}}>
                        <b>Network mismatch!!!</b><br/>
                        MetaMask Current: {this.state.mmNetwork} <br/>
                        User Selected: {this.state.network} <br/>
                    </span></>
                    : ""}
                <button onClick={(e) => {
                    this.do_disconnect()
                }}>
                    Disconnect from metamask
                </button>
                <br/>
            </>,
            "Network");
    }

    S(value) {
        return value === undefined ? "undefined" : value.toString();
    }


    card_p(X, _idx) {
        return (<p key={this.S(_idx)} className="card-text"> {X} </p>);
    }

    card(content, title, use_p) {
        return <>
            <div className="card shadow-sm">
                <div className="card-body">
                    {title ? <h5 className="card-title"> {title} </h5> : ""}
                    {content}
                </div>
            </div>
        </>
    }


    page(X) {
        return <div className="album py-5 bg-light">
            <div className="container">
                <div className="card-columns">
                    {X}
                </div>
            </div>
        </div>
    }

    tabs(tabsdata) {
        function cb(newdata) {
            this.setState({current_tab: newdata})
        }
        let T = new Tabs(tabsdata, this.state.current_tab, cb.bind(this));
        return T.dump();
    }

    XCard(size, content, title) {
        let gentitle = ()=>title? <h5 className="card-title">{title}</h5> : <></>
        return (
                <div className="card shadow p-3 mb-5 bg-white rounded">
                    <div className="card-body">
                        {gentitle()}
                        {content}
                    </div>
                </div>
        );
    }

    //------ oracle table -----
    oracle_to_table(oracle) {
        let round_to_str = (pair, a, b, c) => {
            let pts = ethers.utils.bigNumberify(a).toString();
            let sel = ethers.utils.bigNumberify(b).toString();
            let cur = c.toString();
            return `${pair}: ${pts} pts, ${sel} sel, now: ${cur}`;
        }
        return [
            spantt(oracle.owner, "always"),
            spantt(oracle.address, "auto"),
            oracle.ns,
            ethers.utils.formatEther(oracle.stake),
            oracle.pairs ? oracle.pairs.join(", ") : "-",
            oracle.pairs ? (oracle.pairs.map((pair) => {
                const c = oracle.roundinfo[pair];
                try {
                    return round_to_str(pair, c.points, c.selectedInRound, c.selectedInCurrentRound);
                } catch (err) {
                    return round_to_str(pair, c[0], c[1], c[2]);
                }
            })).join(" | ") : "-",
            oracle.gas? ethers.utils.formatEther(oracle.gas) : "-"
        ];
    }

    ot_row_attrs(idx, attrs) {
        if (this.state.highlight_idx == null) {
            return attrs;
        }
        if (this.state.highlight_idx !== idx) {
            return attrs;
        }
        attrs["className"] = "table-success";
        return attrs;
    }

    async _update_oracle(address) {
        let odata = await this._get_oracle_info(address);
        let oracle_reg_info = naive_copy(this.state.mgr_oracle_reg_info);
        for (let _idx in oracle_reg_info) {
            const cur_od = oracle_reg_info[_idx];
            if (addreq(cur_od.address, odata.address)) {
                oracle_reg_info[_idx] = odata;
            }
        }
        return new Promise((resolve, reject) => {
            this.setState({
                mgr_oracle_reg_info: oracle_reg_info
            }, resolve);
        });
    }

    _reset_ns(e) {
        e.preventDefault();
        const oracle = this.state.temp_oracle;
        this.setState({temp_ns: oracle.ns});
    }

    _reset_stake(e) {
        e.preventDefault();
        const oracle = this.state.temp_oracle;
        this.setState({temp_stake: ethers.utils.formatEther(oracle.stake)});
    }

    _validateStake(input_stake) {
        const oracle = this.state.temp_oracle;
        const test = ethers.utils.parseEther(input_stake);
        if (!test.gt(oracle.stake)) {
            throw new Error(`Cant be less than current: ${oracle.stake.toString()}`);
        }
    }

    _onchange_stake(e) {
        e.preventDefault();
        let new_stake = e.target.value;
        try {
            //this._validateStake(new_stake); // we temporarily accept invalid stakes
            this.setState({temp_stake: new_stake});
        } catch (err) {
            console.error(`Invalid value: ${new_stake}.`)
        }
    }

    _onchange_ns(e) {
        e.preventDefault();
        this.setState({temp_ns: e.target.value});
    }

    __updating(addr, on_off, msg) {
        let up = naive_copy(this.state.temp_updating);
        if (on_off) {
            //adding update
            up[addr.toLowerCase()] = msg;
        } else {
            //array_rm(up, addr.toLowerCase())
            delete up[addr.toLowerCase()]
        }
        this.setState({temp_updating: up});
    }

    __updating_get(address) {
        return this.state.temp_updating[address.toLowerCase()];
    }

    __find_raw_cp(cp) {
        for (const c of this.get_coinpairs()) {
            if (cp === c.pair) {
                return c.raw;
            }
        }
    }

    _update_cp(e, oracle, cp) {
        e.preventDefault();
        const new_value = e.target.checked;
        const addr = oracle.address;
        const mgr = this.oracle_mgr;
        const rawcp = this.__find_raw_cp(cp);

        let f = new_value ? mgr.suscribeCoinPair : mgr.unsuscribeCoinPair;
        f(addr, rawcp, M())
            .then((tx) => {
                this.__updating(addr, true, "sent");
                this._reset_edit();
                on_tx_ok(tx, "update cp subscription")
                    .then((xxx) => {
                        this.__updating(addr, true, "updating");
                        this._update_oracle(addr).then(() => {
                            this.__updating(addr, false);
                        });
                    })
                    .catch((err) => {
                        this.__updating(addr, false);
                        on_tx_err(err, "update cp subscription")
                    });
            })
            .catch((err) => on_tx_err(err, "update cp subscription"));
    }

    _remove_oracle(e, idx) {
        e.preventDefault();
        let oracle = this.state.mgr_oracle_reg_info[idx];
        const addr = oracle.address;
        this.oracle_mgr.removeOracle(addr, M())
            .then((tx) => {
                this.__updating(addr, true, "sent");
                this._reset_edit();
                on_tx_ok(tx, "update cp subscription")
                    .then((xxx) => {
                        this.__updating(addr, true, "updating");
                        this._manager_update().then(() => {
                            this.__updating(addr, false);
                        });
                    })
                    .catch((err) => {
                        this.__updating(addr, false);
                        on_tx_err(err, "update cp subscription")
                    });
            })
            .catch((err) => on_tx_err(err, "update cp subscription"));
    }

    _save_ns(e) {
        e.preventDefault();
        const addr = this.state.temp_oracle.address;
        new_iaddr(
            this.oracle_mgr,
            this.state.temp_oracle.address,
            this.state.temp_ns,
            () => {
                this.__updating(addr, true, "sent");
                this._reset_edit();
            }).then(
            () => {
                this.__updating(addr, true, "updating");
                this._update_oracle(addr).then(() => {
                    this.__updating(addr, false);
                });
            }
        );
    }

    _save_stake(e) {
        e.preventDefault();
        const msg = "add stake";
        const oracle = this.state.temp_oracle;
        const addr = oracle.address;
        const toAdd = ethers.utils.parseEther(this.state.temp_stake).sub(oracle.stake);
        this.oracle_mgr.addStake(addr, toAdd, M())
            .then((tx) => {
                this.__updating(addr, true, "sent");
                this._reset_edit();
                on_tx_ok(tx, msg)
                    .then((xxx) => {
                        this.__updating(addr, true, "updating");
                        this._update_oracle(addr).then(() => {
                            this.__updating(addr, false);
                        });
                    })
                    .catch((err) => {
                        this.__updating(addr, false);
                        on_tx_err(err, msg)
                    });
            })
            .catch((err) => on_tx_err(err, msg));
    }

    _on_row_click(idx) {
        if (idx === this.state.highlight_idx) {
            return;
        }
        console.log(`Selected oracle at: ${idx}.`);
        let new_state = {
            highlight_idx: idx,
        };

        if ((this.state.ot_last_idx !== null) &&
            (this.state.ot_last_idx !== idx)) {
            this._reset_edit(new_state);
            return
        }
        this.setState(new_state);
    }

    _is_edit_avail(idx) {
        if ((this.state.ot_last_idx !== null) &&
            (this.state.ot_last_idx !== idx)) return false;
        let oracle = this.state.mgr_oracle_reg_info[idx];
        let updating = this.__updating_get(oracle.address);
        return ((updating == null) || (updating === undefined));
    }

    _select_edit(e, idx) {
        e.preventDefault();
        if (this.state.ot_last_idx === null) {
            let oracle = this.state.mgr_oracle_reg_info[idx];
            this.setState({
                ot_last_idx: idx,
                temp_ns: oracle.ns,
                temp_stake: ethers.utils.formatEther(oracle.stake),
                temp_oracle: oracle,
            });
        } else {
            this._reset_edit();
        }
    }

    _reset_edit(state) {
        if (state == null) {
            state = {};
        }
        state["ot_last_idx"] = null;
        state["temp_ns"] = null;
        state["temp_oracle"] = {};
        this.setState(state);
    }

    oracle_to_table2(oracle, idx) {
        const state = this.state;
        let lastidx = state.ot_last_idx;
        let base = this.oracle_to_table(oracle);
        let updating = this.__updating_get(oracle.address);

        if (addreq(oracle.owner, this.state.address) &&
            (ICONS_ALWAYS || (idx === this.state.highlight_idx))) {
            let klasses = "badge ";
            if (!this._is_edit_avail(idx)) {
                klasses += "disabled ";
            }

            base = base.concat(<>
                    <a href={null_href()}
                       className={klasses + "badge-info"}
                       onClick={(e) => this._select_edit(e, idx)}>
                        {edit()}
                    </a>
                </>
            );
            base = base.concat(
                <a href={null_href()}
                   className={klasses + "badge-danger"}
                   onClick={(e) => this._remove_oracle(e, idx)}>
                    {trash()}
                </a>
            );
        } else {
            base = base.concat([<>&nbsp;</>, <>&nbsp;</>])  //, <>&nbsp;</>
        }

        if (idx === lastidx) {
            function checked(cp) {
                return -1 !== oracle.pairs.indexOf(cp.pair.toString());
            }

            base[2] = <><label className="sr-only" htmlFor="inlineFormInputGroupUsername2">net address</label>
                <div className="input-group mb-2 mr-sm-2">
                    <input type="text" className="form-control"
                           id="inlineFormInputGroupUsername2"
                           value={this.state.temp_ns}
                           onChange={(e) => this._onchange_ns(e)}
                           placeholder="net address"/>
                    <div className="input-group-append">
                        <button className="btn btn-outline-secondary" type="button"
                                onClick={(e) => this._save_ns(e)}>
                            {save()}
                        </button>
                        <button className="btn btn-outline-secondary" type="button"
                                onClick={(e) => this._reset_ns(e)}>
                            {close()}
                        </button>
                    </div>
                </div>
            </>

            base[3] = <><label className="sr-only" htmlFor="inlineFormInputGroupStake">stake</label>
                <div className="input-group mb-2 mr-sm-2">
                    <input type="text" className="form-control"
                           id="inlineFormInputGroupStake"
                           value={this.state.temp_stake}
                           onChange={(e) => this._onchange_stake(e)}
                           placeholder="stake"/>
                    <div className="input-group-append">
                        <button className="btn btn-outline-secondary" type="button"
                                onClick={(e) => this._save_stake(e)}>
                            {save()}
                        </button>
                        <button className="btn btn-outline-secondary" type="button"
                                onClick={(e) => this._reset_stake(e)}>
                            {close()}
                        </button>
                    </div>
                </div>
            </>


            base[4] = state.cp.map(cp =>
                <div className="form-check mb-2 mr-sm-2">
                    <input className="form-check-input" type="checkbox"
                           id="inlineFormCheck"
                           checked={checked(cp)}
                           onChange={(e) => this._update_cp(e, oracle, cp.pair.toString())}/>
                    <label className="form-check-label" htmlFor="inlineFormCheck">
                        {cp.pair.toString()}
                    </label>
                </div>
            )
        }
        if (updating) {
            base[5] = <span>{spinner()} ({updating}) </span>;
        }
        return base;
    }

    render() {
        if (!this.state.metamask_ok) {
            return this.page(<>
                {this.XCard(6, <>
                    <span style={{color: "#ff0000"}}>Metamask is required!</span>
                </>, "Addon missing")}
            </>);
        }
        if (!this.state.connected) {
            return this.page(<>
                {this.network_connect()}
            </>);
        } else {
            let t_manager = {
                name: "Oracles", fn: (state, x)=> x.data, data: <>
                <div className="card-deck">
                    {this.global_info()}
                </div>

                <div className="card-deck">
                    {this.XCard(6, <>
                        {this.mgr_stake ? this.mgr_stake.dump() : <></>}
                    </>, "Registration")}

                    {this.get_cp_short()}
                </div>

                <div className="card-deck">
                    {this.XCard(6,
                        Table(OracleColumns.concat([<>&nbsp;</>, <>&nbsp;</>,]),
                            this.state.mgr_oracle_reg_info.map(this.oracle_to_table2), {
                                rowattrs: this.ot_row_attrs,
                                nonresponsive: false,
                                classes: "table-striped",
                                alignf: (idx) => in_(idx, [2,6])? align_left :
                                                (in_(idx, [3])? align_right : align_center),
                                odata: this.state.mgr_oracle_reg_info,
                                rowclick: (e, idx) => {
                                    e.preventDefault();
                                    this._on_row_click(idx);
                                }
                            }),
                        "Registered oracles")}
                </div>
                </>
            };

            let t_supporters = {
                name: "Supporters", fn: (state, x)=> x.data, data: <>
                    {this.global_info()}
                    {this.XCard(6, <>
                        {this.sup_stake ? this.sup_stake.dump() : <></>}
                    </>, "Supporter Info")}

                    {this.XCard(6, <>
                        {this.sup_info ? this.sup_info.dump_text() : <></>}
                    </>, "Supporters Variables")}

                </>
            };
            let t_info = {
                name: "Info", fn: (state, x)=> x.data, data: <>
                    {this.global_info()}
                    {this.get_cp_name_address_switch()}

                    {this.XCard(6, <>
                        {this.sup_info ? this.sup_info.dump() : <></>}
                    </>, "Supporters Info")}
                    {this.XCard(6, <>
                        {this.c_suplist ? this.c_suplist.dump_text() : <></>}
                    </>, "Supporters Whitelist")}

                </>
            };

            let cp_tab = (cp) => {
                return {
                    name: cp.pair, fn: (state, x)=> x.data, data: <>{this.global_info()}<span>
                    {this.card(<>
                        <form className="needs-validation" noValidate>
                            {this.cp_comps[cp.pair].dump_text()}
                        </form>
                    </>, cp.pair + " price contract info")}
                </span></>
                }
            }

            let tabs = [
                t_manager,
                t_supporters]
            tabs = tabs.concat(this.get_coinpairs_ready().map(cp => cp_tab(cp)));
            return this.tabs(tabs.concat(t_info));
        }
    }
}


ReactDOM.render(
    <Console/>,
    document.getElementById('root')
);
