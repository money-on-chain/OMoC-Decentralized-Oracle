import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { ethers } from 'ethers';
import * as TOKEN_DATA from './contracts/TestMOC.json';
import * as CONTRACT_DATA from './contracts/OracleManager.json';
import * as CPP_DATA from './contracts/CoinPairPrice.json';
import * as SUPVESTCPP_DATA from './contracts/SupportersVested.json';
import * as SUPLISTCPP_DATA from './contracts/SupportersWhitelisted.json';
import { SupportersStake, OracleStake } from './stake.js';
import { Table, spantt, getTimeout, formatEther, isValid, Grey, HL, align_left, align_right, align_center } from './helpers.js';
import { CoinPairPriceAllInfo, SupportersInfo, SupportersWhitelist} from "./contractinfo.js";

import {M, on_tx_ok, on_tx_err} from "./helpers.js";

const SUPLISTCPP_ABI = SUPLISTCPP_DATA["abi"];
const SUPPORTERS_VESTED_ABI =  SUPVESTCPP_DATA["abi"];
const CPP_ABI = CPP_DATA["abi"];
const TOKEN_ABI = TOKEN_DATA["abi"];
const CONTRACT_ABI = CONTRACT_DATA["abi"];


const SUPPORTERS_VESTED_ADDR = process.env.REACT_APP_SupportersVested; 
const CONTRACT_ADDR = process.env.REACT_APP_OracleManager; 
const NETWORK = process.env.REACT_APP_NetworkID;
const SUPLISTCPP_ADDR = process.env.REACT_APP_SupportersWhitelisted;


function oracle_to_table(oracle) {
    return [
        spantt(oracle.owner, "always"),
        spantt(oracle.address, "auto"),
        oracle.ns,
        ethers.utils.formatEther(oracle.stake),
        oracle.pairs ? oracle.pairs.join(", "): "-",
        oracle.pairs ? (oracle.pairs.map( (pair) => {
            let c = oracle.roundinfo[pair];
            let pts = ethers.utils.bigNumberify(c.points).toNumber();
            let sel = ethers.utils.bigNumberify(c.selectedInRound).toNumber();
            let cur = c.selectedInCurrentRound.toString();
            return `${pair}: ${pts} pts, ${sel} sel, now: ${cur}`;
        })).join(" | "): "-",
//        ethers.utils.formatEther(oracle.mocs),
    ];
}


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

const OracleColumns = ["#", "owner", "address", "net address", "stake", "pairs", "rounds"];  // , "MOCs"]


class Console extends React.Component {
    do_disconnect() {
        this.setState({
            connected: false,
            web3Provider: null,
            signer: null,
            contract: null,
            token: null,
            provider: null,
        });
    }

    do_connect(accounts, network) {
        const self = this;
        var web3Provider = new ethers.providers.Web3Provider(window.web3.currentProvider);
        const signer = web3Provider.getSigner();
        const oracle_mgr = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, signer);
        const ethereum = window['ethereum'];

        const sup_vest_contract = new ethers.Contract(SUPPORTERS_VESTED_ADDR, SUPPORTERS_VESTED_ABI, signer);
        this.suplist = new ethers.Contract(SUPLISTCPP_ADDR, SUPLISTCPP_ABI, signer);
        
        this.c_suplist = new SupportersWhitelist("supp_wlist_", this, {contract: this.suplist, abi:SUPLISTCPP_ABI});


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
        this.mgr_stake = new OracleStake("mgr__", this, oracle_mgr, "Oracle Manager");
        this.sup_info = new SupportersInfo("supp_info__", this, {contract: sup_vest_contract, abi:SUPPORTERS_VESTED_ABI});

        this.setState({
            connected: true,
            network: network,
            mmNetwork: ethereum.networkVersion,

            web3Provider: web3Provider,
            signer: signer,
            provider: ethereum,
            oracle_manager: oracle_mgr,

            address: accounts[0],  // the only one
        }, ()=> {
            this.to = setInterval(()=>{self._update()}, getTimeout());
        });
    }

    get_state() {
        return this.state;
    }

    metamask_ok() {
        let eth = window['ethereum'];
        return eth!==undefined && eth !==null;
    }

    constructor(props) {
        super(props);
        this.in_update = false;

        this.state = {
            metamask_ok: this.metamask_ok(),
            ethers: ethers,
            utils: ethers.utils,
            connected: false,

            mgr_token_addr: null,
            cpr: null,
            cp: null,

            web3Provider: null,
            signer: null,
            token: null,
            provider: null,
            address: "",

            //temp
            latestblock: null,
            blocknr: "(fetching)",

            //tabs
            current_tab: "Oracles",

            //supporters vested
            supp_vested_ct_props: {},

            // stake
            sup_stake: null,
            mgr_stake: null,
        };
        this.cp_comps = {};
        this.contracts = {};
        this._register_update= this._register_update.bind(this);
        this._manager_update= this._manager_update.bind(this);
        this.new_coinpairs = this.new_coinpairs.bind(this);

        this.sup_stake = null;
        this.sup_info = null;
        this.mgr_stake = null;
        this.suplist = null;
        this.c_suplist = null;

        (new SupportersStake("sup__", this)).init_state(this.state);
        (new OracleStake("mgr__", this)).init_state(this.state);
        (new SupportersInfo("supp_info__", this)).init_state(this.state);
        (new SupportersInfo("supp_wlist_", this)).init_state(this.state);

        this._manager_init(this.state);
        this._update();
    }

    isValid(address) {
        return isValid(address);
    }

    componentDidUpdate() {
        window.$('[data-toggle="tooltip"]').tooltip({html: true});
    }

    componentDidMount() {        
        if (this.metamask_ok()) {
            const ethereum = window['ethereum'];
            ethereum.enable().then((accounts)=>{
                this.do_connect(accounts, NETWORK); // XXX TO DO DAVE
            }).catch((err)=>console.error(err));    
        }
        window.$('[data-toggle="tooltip"]').tooltip({html: true});
    }

    handleAddressChange(event) {
        this.setState({ address: event.target.value });
    }

    async fetch_cpr_data() {
        let cpr = this.state.oracle_manager;

        let data = [];
        try {
            let pairs = await cpr.getCoinPairCount();
            let et = ethers.utils.bigNumberify(pairs);
            pairs = parseInt(et);
            if (pairs===0) {
                console.warn("There seems to be no coinpairs registered!");
            } else {
                console.log(`There are ${pairs} coinpairs registered!`);
            }
            try {
                for(let idx=0; idx<pairs; idx++) {
                    let cp = await cpr.getCoinPairAtIndex(idx);
                    let cp_addr = await cpr.getContractAddress(cp);
                    data.push({
                        pair:ethers.utils.parseBytes32String(cp), 
                        raw: cp, 
                        address: cp_addr});
                }
    
            } catch(err) {
                console.error(err)
                throw err;
            }
        } finally {
            if (data.length===0) {
                data=null
            };
            return {
                cpr,
                cp: data
            }
        }
    }

    // async getBlockNr() {
    //     return new Promise((resolve, reject)=> {
    //         try {
    //             window.web3.eth.getBlockNumber((err, blocknr) => {
    //                 if (err) {
    //                     reject(err);
    //                 }
    //                 resolve(blocknr);
    //             });
    //         }
    //         catch(err) {
    //             reject(err);
    //         }
    //     })
    // }

    async getBlock() {
        return new Promise((resolve, reject)=> {
            try {
                window.web3.eth.getBlock("latest", (err, blocknr) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(blocknr);
                });
            }
            catch(err) {
                reject(err);
            }
        })
    }

    async _register_update() {
        let cpr_cp;
        let newst = {};

        try {
            let block = await this.getBlock();
            //if ((this.state.lastblock && block.hash===this.state.lastblock.hash) && (this.state.cp!==null) && (this.state.mgr_oracle_reg_info && this.state.mgr_oracle_reg_info.length!==0)) {  // mgr_oracle_reg_info
             //   return false;
            //}
            newst.blocknr = block.number;
            newst.lastblock = block;
            newst.minOracleOwnerStake = await this.state.oracle_manager.minOracleOwnerStake();
            
            if (this.state.mgr_token_addr===null) {
                newst.mgr_token_addr = await this.state.oracle_manager.token();
                newst.token = new  ethers.Contract( newst.mgr_token_addr, TOKEN_ABI, this.state.signer);
            }
        } catch(err) {
            console.error(1, err)
        }

        if (this.state.cp==null) {
            cpr_cp = await this.fetch_cpr_data();
            if (cpr_cp.cp) {
                newst.cp = cpr_cp.cp;
                newst.cpr = cpr_cp.cpr;
                this.setState(newst, ()=>this.new_coinpairs(cpr_cp.cp));
                return true;    
            }
        } 
        this.setState(newst);
        return true;
    }

    new_coinpairs(cps) {
        const signer = this.state.signer;
        let comps = {};
        let st = {};
        let contracts = {};

        for (let cp of cps) {
            let pair = cp.pair;
            contracts[pair] = new ethers.Contract(cp.address, CPP_ABI, signer);
            let comp = new CoinPairPriceAllInfo("cp_"+pair+"__", this, {contract: contracts[pair]});
            comp.init_state(st);
            comps[cp.pair] = comp;
        }

        this.setState(st, ()=>{
            this.contracts = contracts;
            this.cp_comps = comps;    
        });
    }

    get_coinpairs() {
        return this.state.cp? this.state.cp : [];
    }

    get_coinpairs_ready() {
        return this.state.cp? this.state.cp.filter(cp => this.cp_comps[cp.pair]) : [];
    }

    async _get_cp_oracle_data(oracle, pair) {
        let subscribed = await this.state.oracle_manager.isSuscribed(oracle, pair.raw);
        if (!subscribed) {
            return null;
        }
        return await this.state.oracle_manager.getOracleRoundInfo(oracle, pair.raw);
    }

    async _manager_update() {
        let oracle_reg_info = [];
        let cp = this.get_coinpairs();
        let current = await this.state.oracle_manager.getRegisteredOracleHead();
        while (current!=="0x0000000000000000000000000000000000000000") {
            let pairs = [];
            let allinfo = {};
            for (let pair of cp) {
                let info = await this._get_cp_oracle_data(current, pair);
                if(info!=null) {
                    pairs.push(pair.pair);
                    allinfo[pair.pair] = info;
                }
            }
            let x = await this.state.oracle_manager.getOracleRegistrationInfo(current);
            // let mocs = await this.suplist.getMOCBalanceAt(this.state.oracle_manager.address, current);
            let oc = {
                address: current,
                ns: x[0],
                stake: x[1],
                owner: x[2],
                roundinfo: allinfo,
                //mocs,
                pairs
            };
            oracle_reg_info.push(oc);
            current = await this.state.oracle_manager.getRegisteredOracleNext(current);
        }

        this.setState({
            mgr_oracle_reg_info: oracle_reg_info
        });
    }

    _manager_init(st) {
        st["mgr_oracle_reg_info"] = [];
    }

    async _a_update() {
        let fs = [
            {f:this._manager_update, n:"manager update"},
        ].concat(
            (this.mgr_stake? {f:this.mgr_stake.update, n:"mgr"}:[]))
        .concat(
            (this.sup_stake? {f:this.sup_stake.update, n:"sup"}:[]))

        .concat(
            (this.c_suplist? {f:this.c_suplist.update, n:"sup whitelist"}:[]))
    
        .concat(
            (this.sup_info? {f:this.sup_info.update,n:"supportersinfo"}:[] )
        );

        let new_block = await this._register_update();
        if (new_block) {

            for (let cp of this.get_coinpairs()) {
                const comp = this.cp_comps[cp.pair];
                if(comp) {
                    fs = fs.concat({f:comp.update, n:"comp-"+cp.pair});
                }
            }
    
            for (let f of fs) {
                try{
                    await f.f();
                } catch(err) {
                    console.error(`Error: ${f.n} failed!!!! `);
                    console.error(err);
                }
            }    
        }
    }

    _update() {
        let metamask_ok = this.metamask_ok();
        if (metamask_ok!==this.state.metamask_ok) {
            this.setState({metamask_ok});
        }        
        if (!this.state.connected){
            return;
        }
        if (!this.in_update) {
            this.in_update = true;
            this._a_update()
                .then((ret) => {this.in_update=false})
                .catch((err)=>{console.error(2, err); this.in_update=false;});
        }
    }

    waitTx(hash) {
        console.log("asking for tx: " + hash);
        let tx = this.state.provider.eth_getTransactionByHash(hash);
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
        if(!contract){
            alert(`Contract for ${pair} isn't loaded yet. Please retry in a few seconds.`);
            return;
        }
        contract.switchRound(M())
            .then((tx)=>on_tx_ok(tx, "switch round: "+pair))
            .catch(err => on_tx_err(err, "switch round: "+pair))
    }

    distribute(e) {
        e.preventDefault();
        let contract = this.suplist;
        contract.distribute(M())
            .then((tx)=>on_tx_ok(tx, "distribute"))
            .catch(err => on_tx_err(err, "distribute"))
    }

    get_oraclemgr_info() {
        return this.card(
            <>
                minOracleOwnerStake: {formatEther(this.state.minOracleOwnerStake)} tokens <br/>
                mgr_token_addr: {this.state.mgr_token_addr} <br/>
                <h6> pairs </h6>
                {Table(["Pair", "Address", ""], this.get_coinpairs().map(x=>[x.pair, spantt(x.address), this.button("switch round", (e)=>this.switch_round(e, x.pair))]), {nonresponsive:true, classes: "table-sm  .w-auto", incidx: false})}
                <div className="d-flex justify-content-between align-items-center">
                <div className="btn-group">
                    {this.get_coinpairs_ready().map(cp=> 
                        this.button(cp.pair + " switch round", (e)=>this.switch_round(e, cp.pair))
                    )}
                </div>

                <div className="btn-group">
                    <button type="button" className="btn btn-sm btn-outline-secondary"
                            onClick={(e) => this.distribute(e)}>Distribute
                    </button>
                </div>

                </div>
            </>,
        "Coin pairs");
    }


    // cards functions ------------------------------------------------
    button_group(X) {
    return (
        <div className="d-flex justify-content-between align-items-center">
            {X}
        </div>)
    }

    //disabled={true}
    button(text, cb) {
        return (
            <div className="btn-group">
                <button type="button" className="btn btn-sm btn-outline-secondary"
                        onClick={cb}>{text}     
                </button>
            </div>);
    }

    _get_oracle(addr){
        addr = addr.toLowerCase();
        for(let oracle of this.state.mgr_oracle_reg_info) {
            if(oracle.address.toLowerCase()===addr){
                return oracle;
            }
        }
        return null;
    }

    oracle_info(oracle_addr) {
        if (!oracle_addr || !(this.state.mgr_oracle_reg_info))
            return <></>;

        const oracle = this._get_oracle(oracle_addr);
        if (oracle===null) {
            return <><span>(loading..)</span></>;
        }

        return Table(["", `Oracle ${oracle_addr} info`], oracle_to_table(oracle).map( (field, idx) => [OracleColumns.slice(1)[idx], field]
        ), {nonresponsive: true, classes:" table-dark ", incidx: false});
    }
    
    global_info() {
        return <>
        {this.card(                         
            <p className="card-text"> {Grey(<>
                Current block: {HL(this.state.blocknr)}. Your address is: {HL(spantt(this.state.address))}.
                </>)}
            </p>)}

        </>;
    }

    network_connect() {
            return this.card(
                get_networks().map(netid => (
                    <button key={netid} onClick={(e) => {
                        const ethereum = window['ethereum'];
                        ethereum.enable().then((accounts)=>{
                            this.do_connect(accounts, netid);
                        }).catch((err)=>console.error(err));
                    }}>Connect to metamask - net {netid}</button>
                )), "Network");
    }

    network_disconnect() {
        return this.card(
            <>
                { this.state.mmNetwork!==this.state.network ? <>
                    <span style={{color: "red"}}>
                        <b>Network mismatch!!!</b><br/>
                        MetaMask Current: {this.state.mmNetwork} <br/>
                        User Selected: {this.state.network} <br/>
                    </span></>
                        : "" }
                <button onClick={(e) => {this.do_disconnect()}}>
                    Disconnect from metamask</button><br/>
            </>,
            "Network");
    }

    S(value) {
        return value===undefined? "undefined" : value.toString();
    }


    card_p(X, _idx) {
        return (<p key={this.S(_idx)} className="card-text"> {X} </p>);
    }

    card(content, title, use_p) {
        return <>
                <div className="card shadow-sm">
                    <div className="card-body">
                        { title ? <h5 className="card-title"> {title} </h5> : "" }
                    {content}
                    </div>
                </div>
        </>
    }

    column(X) {
        return (<>
                {X}
            </>);
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
        let m = {};
        let which = {
            true:{
                cls: "nav-link active",
                aria: "true",
                ccls: "tab-pane fade show active",
            },
            false: {
                cls: "nav-link",
                aria: "false",
                ccls: "tab-pane fade",
            },
        };

        for (let tab of tabsdata) {
            m[tab.name] = which[tab.name === this.state.current_tab];
        }

        return <><ul className="nav nav-tabs" id="myTab" role="tablist">
                {tabsdata.map(tab=> <li className="nav-item">
                    <a className={m[tab.name].cls} aria-selected={m[tab.name].aria} data-toggle="tab" role="tab"
                        id={tab.name+"-tab"} href={'#'+tab.name} aria-controls={tab.name}>{tab.name}</a>
                  </li>
                )}
            </ul>

            <div className="tab-content" id="myTabContent">
                {tabsdata.map(tab=>
                <div className={m[tab.name].ccls} id={tab.name} role="tabpanel" aria-labelledby={tab.name+"-tab"}>
                    {tab.data}
                </div>)}
            </div>
        </>
    }

    XCard(size, content, title) {
        let klass = "col-sm-"+ size.toString();
        return (
          <div className={klass}>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{title}</h5>
                {content}
              </div>
            </div>
          </div>);
    }

    render() {
        if (!this.state.metamask_ok) {
            return this.page( <>
                {this.XCard(6, <>
                    <span style={{color: "#ff0000"}}>Metamask is required!</span>
                </>, "Addon missing")}
            </> );
        }
        if (!this.state.connected) {
            return this.page( <>
                {this.network_connect()}
                </> );
        } else {
            let t_manager = {   
                name:"Oracles",data: <span>
                    {this.global_info()}
                    {this.get_oraclemgr_info()}

                    {this.XCard(6, <>
                        {this.mgr_stake?this.mgr_stake.dump():<></>}
                    </>, "Oracle Manager Info")}

                    {this.XCard(6, <>
                        {this.c_suplist? this.c_suplist.dump_text():<></>}
                    </>, "Supporters Whitelist")}

                    {this.card(
                    Table(OracleColumns, this.state.mgr_oracle_reg_info.map(oracle_to_table), {
                        nonresponsive: true, 
                        classes:"table-striped", 
                        alignf: (idx) => idx===2? align_left : (idx===3?align_right:align_center)
                    }),
                    "all - oracles")}
                </span>
            };

            let t_supporters = { name:"Supporters", data: <>
                    {this.global_info()}
                    {this.XCard(6, <>
                        {this.sup_stake?this.sup_stake.dump():<></>}
                    </>, "Supporter Info")}

                    {this.XCard(6, <>
                        {this.sup_info?this.sup_info.dump_text():<></>}
                    </>, "Supporters Variables")}
                    
                </>
            };
            let t_info = { name:"Info", data: <>
                    {this.global_info()}
                    {this.XCard(6, <>
                        {this.sup_info?this.sup_info.dump():<></>}
                    </>, "Supporters Info")}
                    
                </>
            };

            let cp_tab = (cp) => {return {   
                name:cp.pair, data: <>{this.global_info()}<span>
                    {this.card(<>
                        <form className="needs-validation" noValidate>
                                {this.cp_comps[cp.pair].dump_text()}
                        </form></>, cp.pair+" price contract info")}

                </span></>}}

            let tabs = [ 
                t_manager,
                t_supporters ]
            tabs = tabs.concat (this.get_coinpairs_ready().map(cp => cp_tab(cp)));
            return this.tabs(tabs.concat(t_info));
        }
    }
}


ReactDOM.render(
    <Console />,
    document.getElementById('root')
);
