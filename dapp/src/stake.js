import React from 'react';
import './index.css';
import { ethers } from 'ethers';
import { bigNumberifyAndFormatInt, isValid, isValidNS, HL, Grey, obj_get_props, TT, M, Adr, formatEther} from './helpers.js';
import {on_tx_ok, on_tx_err } from "./helpers.js";
import {null_href, Tabs} from "./helpers";


const ALLOW_MINT = process.env.REACT_APP_AllowMint;


export class MyBase {
    constructor (name, parent) {
        this.name = name;
        this.parent = parent;
    }

    get_state() {
        return this.parent_state()[this.name];
    }
    parent_state() {
        return this.parent.get_state();
    }
    setState(x, cb){
        let st = this.parent_state()[this.name]
        for(let p of obj_get_props(x)) {
            st[p] = x[p];
        }
        let xx = {}
        xx[this.name] = st;
        this.parent.setState(xx, cb);
    }
}


export class Address extends MyBase {
    constructor (name, parent, opts) {
        super(name, parent);
        this.opts = opts;
    }

    init_state(st) {
        st[this.name] = {
            value: "",
        }
    }

    on_change(e) {
        let value = e.target.value;
        this.setState({value});
    }

    set_val(value) {
        this.on_change({target:{value: value}})
    }
    get_value() {
        let f = this.opts["get_value"]? this.opts["get_value"] : (x)=> x ;
        return f(this.get_state()["value"]);
    }

    is_ok() {
        let f = this.opts["chk"] ? this.opts["chk"] : () => true ;
        return f(this.get_value());
    }

    fail_msg() {
        let f = this.opts["msg"] ? this.opts["msg"] : (x) => `Invalid value ${x}`;
        return f(this.get_value());
    }

    is_default() {
        return this.get_value()==="";
    }

    dump() {
        let state = this.get_state();
        let msg = !this.is_ok() && !this.is_default() ? <span>{" ("+this.fail_msg()+")"}</span> : <></>;

        return <><label>{this.opts.label}
        <input type="text" value={state.value}
            onChange={(e) => this.on_change(e)} name="address-{this.name}"/>  {msg}
    </label><br/></>
    }    
}


export class Stake extends MyBase {
    constructor(name, parent, contract, contract_name) {
        super(name, parent);
        this.contract = contract;
        this.contract_name = contract_name;
        this.update = this.update.bind(this);
    }

    init_state(st) {
        let x = ethers.utils.bigNumberify(-1);
        st[this.name] = {
            allowance: x,
            tokenBalance: x,
            gen_amount: "0",
            view: 0,
        }
    }

    async update() {
        try {
            let allowance = await this.token().allowance(this.parent_state().address, this.sup_contract().address);
            let tokenBalance = await this.token().balanceOf(this.parent_state().address);
            this.setState({
                allowance,
                tokenBalance,
            });
        }
        catch(err){
            console.error(err)
        }
    }

    token() {
        return this.parent.token;
    }
    sup_contract() {
        return this.contract;
    }


    _dump_input_amount(state, label){
        if (!label) {
            label = "Amount";
        }
        return <span className="card-text">
        <label>{label}&nbsp; 
            <input type="text" value={state.gen_amount}
                   onChange={(e) => this.gen_amount_chg(e)} name="gen_amount"/>
        </label> tokens.
    </span>
    }

    _dump_g_button(text, cb) {
        return <a href={null_href()} onClick={(e)=>cb(e)}
                className="btn btn-primary">{text}</a>
    }

    dump_allowance_info(state) {
        if (!state) return <></>;
        return <>           
        <span className="card-subtitle mb-2 text-muted">
        Address <span {... TT(this.parent_state().address)}>{Adr(this.parent_state().address)}</span> balance:
                    {HL(formatEther(state.tokenBalance))} tokens</span>
    </>;
    }


    _dump_mint() {
        const state = this.get_state();
        return <div className="card-body">
          {/* <h5 className="card-title">Special title treatment</h5> */}
          <p className="card-text">{this.dump_allowance_info(state)}<br/>
          {this._dump_input_amount(state, "Amount to mint")}
          </p>
          {this._dump_g_button("mint", (e)=>this.new_mint(e))}
        </div>
    }

    _dump_allow() {
        const state = this.get_state();
        return <div className="card-body">
          {/* <h5 className="card-title">Special title treatment</h5> */}
          <p className="card-text">
              {this.dump_allowance_info(state)}<br/>
              {this._dump_input_amount(state, "Amount to allow")}
        </p>
          {this._dump_g_button("allow", (e)=>this.new_allow(e))}
        </div>
    }
    
    views() {
        let mint = {name: "Mint", fn:this._dump_mint};
        let views = this.Views;
        if (ALLOW_MINT) {
            views = [mint].concat(views);
        }
        for (let v of views) {
            v.fn = v.fn.bind(this);
        }
        return views;
    }

    dump_contract_info() {
        return <h6 className="card-subtitle mb-2 text-muted">
        Address <span {... TT(this.parent_state().address)}>{Adr(this.parent_state().address)}</span></h6>
    }

    dump() {
        const cb = (new_state) => {
            this.setState({view: new_state})
        }
        let state = this.get_state();
        const T = new Tabs(this.views(), state.view,
            cb.bind(this), true);
        return T.dump();
    }

    distribute(event) {
        event.preventDefault();
        this.sup_contract().distribute(M())
            .then((tx)=>on_tx_ok(tx, "distribute"))
            .catch((err)=>on_tx_err(err, "distribute"));
    }

    gen_amount_chg(event) {
        let gen_amount = event.target.value;
        this.setState({gen_amount});
    }

    new__test_value() {
        //validates the "amount"..
        let x = '';
        try {
            x = this.get_state().gen_amount;
            if (x===undefined) { x='' };
            ethers.utils.parseEther(x);
            return true;
        } catch(err) {
            alert("Invalid amount: '"+x+"'.");
        }
        return false;
    }

    new_allow(event) {
        event.preventDefault();
        if (!this.new__test_value()) {
            return;
        }
        let stake_bn = ethers.utils.parseEther(this.get_state().gen_amount);
        this.token().approve(this.sup_contract().address, stake_bn, M())
            .then((tx)=>on_tx_ok(tx, "token allow oracle"))
            .catch((err)=>on_tx_err(err, "token allow oracle"));
    }

    new_stake(event) {
        event.preventDefault();
        if (!this.new__test_value()) {
            return;
        }
        let stake_bn = ethers.utils.parseEther(this.get_state().gen_amount);
        this.sup_contract().addStake(stake_bn, M())
            .then((tx)=>on_tx_ok(tx, "supporter add stake"))
            .catch((err)=>on_tx_err(err, "supporter add stake"));
    }

    new_stop(event) {
        event.preventDefault();
        this.sup_contract().stop(M())
            .then((tx)=>on_tx_ok(tx, "stop"))
            .catch((err)=>on_tx_err(err, "stop"));
    }

    new_withdraw(event) {
        event.preventDefault();
        //let stake_bn = ethers.utils.parseEther(this.get_state().gen_amount);
        this.sup_contract().withdraw(M())
            .then((tx)=>on_tx_ok(tx, "withdraw"))
            .catch((err)=> on_tx_err(err, "withdraw"));
    }

    new_mint(event) {
        event.preventDefault();
        if (!this.new__test_value()) {
            return;
        }
        let stake_bn = ethers.utils.parseEther(this.get_state().gen_amount);
        this.token().mint(this.parent_state().address, stake_bn, M())
            .then((tx) => on_tx_ok(tx, "mint"))
            .catch((err) => on_tx_ok(err, "mint"));
    }
}

export class SupportersStake extends Stake {
    constructor(name, parent, contract, contract_name) {
        super(name, parent, contract, contract_name);
        this.dump_allowance_info = this.dump_allowance_info.bind(this);
    }

    init_state(st) {
        super.init_state(st);
        let x = ethers.utils.bigNumberify(-1);
        let xx = st[this.name];
        xx.staked= x;
        xx.stakedInBlock= x;
        xx.stopped= x;
        xx.stoppedInBlock= x;
        xx.minStayBlocks= x;
        xx.minStopBlocks= x;
    }

    dump_allowance_info(state){
        return <>
            {super.dump_allowance_info(state)}
            <span className="card-subtitle mb-2 text-muted">
        Address <span {... TT(this.parent_state().address)}>{Adr(this.parent_state().address)}</span> staked:
                    {HL(formatEther(state.stopped.add(state.staked)))} tokens</span>

            {Grey(<>
        Detailed Balance in contract at block {HL(this.parent_state().blocknr)}:
        <br/>
        Staked: {HL(formatEther(state.staked))} tokens at
                block {bigNumberifyAndFormatInt(state.stakedInBlock)} you&quot;ll be abled to stop at block
                    {" "+bigNumberifyAndFormatInt(state.stakedInBlock.add(state.minStayBlocks))}.        
        <br/>        
        Stopped: {HL(formatEther(state.stopped))} tokens at
                block {bigNumberifyAndFormatInt(state.stoppedInBlock)} you&quot;ll be abled to withdraw
                    {" "+bigNumberifyAndFormatInt(state.minStopBlocks)} blocks after stop.<br/>
        </>)}
        </>;
    }

    async update() {
        await super.update();
        try {
            let result = await this.sup_contract().detailedBalanceOf(this.parent_state().address);
            let minStayBlocks = await this.sup_contract().minStayBlocks();
            let minStopBlocks = await this.sup_contract().minStopBlocks();
            this.setState({
                minStayBlocks,
                minStopBlocks,
                staked: result[0],
                stakedInBlock: result[1],
                stopped: result[2],
                stoppedInBlock: result[3],
            });
        } catch(err) {
            console.error(err)
        }
    }

    _dump_stop() {
        const state = this.get_state();
        return <div className="card-body">
          {/* <h5 className="card-title">Special title treatment</h5> */}
          <p className="card-text">{this.dump_allowance_info(state)}</p>
          {this._dump_g_button("stop", (e)=>this.new_stop(e))}
        </div>
    }

    _dump_withdraw() {
        const state = this.get_state();
        return <div className="card-body">
          {/* <h5 className="card-title">Special title treatment</h5> */}
          <p className="card-text">
              {this.dump_allowance_info(state)}<br/>
              {this._dump_input_amount(state, "Amount to withdraw")}
          </p>
          {this._dump_g_button("withdraw", (e)=>this.new_withdraw(e))}
        </div>
    }

    Views = [
        {name: "Allow", fn: this._dump_allow},
        {name: "Stop", fn: this._dump_stop},
        {name: "Withdraw", fn: this._dump_withdraw}
    ]
}


export class OracleStake extends Stake {
    Views = [
        {name: "Allow", fn: this._dump_allow},
        {name: "Register", fn: this._dump_register},
        // {name: "Coinpairs", fn: this._dump_coinpairs},
        // {name: "Modify", fn: this._dump_modify},
        // {name: "Remove", fn: this._dump_remove},
    ];

    _dump_register() {
        const state = this.get_state();
        return <div className="card-body">
          {/* <h5 className="card-title">Special title treatment</h5> */}
          <p className="card-text">
                {this.address.dump()}<br/>
                {this.iaddress.dump()}<br/>
                {this._dump_input_amount(state, "Stake")}
           </p>
           {this._dump_g_button("register", 
           (e)=>this.new_register(e))}
        </div>
    }

    _dump_modify() {
        const state = this.get_state();
        return <div className="card-body">
          {/* <h5 className="card-title">Special title treatment</h5> */}
          <p className="card-text">
                {this.address.dump()}<br/>
                {this.iaddress.dump()}<br/>
                {this._dump_input_amount(state, "Stake")} (to do)
           </p>
           {this._dump_g_button("Change", 
           (e)=>this.new_iaddr(e))}
        </div>
    }

    _dump_coinpairs(state) {
        let cp = this.parent_state().cp;
        return <div className="card-body">
          {/* <h5 className="card-title">Special title treatment</h5> */}
          <p className="card-text">
                {this.address.dump()}<br/>
                {cp? this.dump_options(cp): "(fetching)"}
           </p>
           {this._dump_g_button("subscribe", 
           (e)=>this.new_suscribe_cp(e, true))}
           {this._dump_g_button("unsubscribe", 
           (e)=>this.new_suscribe_cp(e, false))}
        </div>
    }

    _dump_remove(state) {
        return <div className="card-body">
          {/* <h5 className="card-title">Special title treatment</h5> */}
          <p className="card-text">
                {this.address.dump()}<br/>
           </p>
           {this._dump_g_button("remove", 
           (e)=>this.new_remove(e))}
        </div>
    }
    

    constructor(name, parent, contract, contract_name) {
        super(name, parent, contract, contract_name);

        this.address = new Address("oracle_address", this, {
            label:"Oracle address ",
            chk: isValid,
            get_value: x => x.toLowerCase(), 
            msg: (x) => " Invalid address: '"+x+"'"});

        this.iaddress = new Address("internet_address", this, {
            label:"Network address ",
            chk: isValidNS,
            msg: () => "Must start with http or https://"});
    }

    setCP(newpair) {
        this.setState({current_cp:newpair});
    }

    dump_options(optlist) {
        let state = this.get_state();
        return optlist.map(x => (
            <span className="form-check">
                <input className="form-check-input" type="radio" name="exampleRadios" onChange={this.setCP.bind(this, x.pair)} id="exampleRadios1" value="option1" checked={state.current_cp===x.pair}/>
                <label className="form-check-label" htmlFor="exampleRadios1">{x.pair.toString()}</label>
            </span>));
    }

    init_state(st) {
        super.init_state(st);
        let xx = st[this.name];
        xx["current_cp"] = "";
        xx["oracle"] = null;
        xx["oraclecp"] = [];
        this.address.init_state(xx);
        this.iaddress.init_state(xx);
    }

    new_register(e) {
        e.preventDefault();
        if (!this.new__test_value()) {
            return;
        }
        const state = this.get_state();
        if (!this.address.is_ok()||!this.iaddress.is_ok()) {
            return alert("Invalid info!");
        }
        let stake_bn = ethers.utils.parseEther(state.gen_amount);
        this.parent.oracle_mgr.registerOracle(
            this.address.get_value(), this.iaddress.get_value(), stake_bn, M())
            .then((tx)=>on_tx_ok(tx, "register oracle"))
            .catch((err)=>on_tx_err(err, "register oracle"));
    }

    new_remove(e) {
        e.preventDefault();
        if (!this.address.is_ok()) {
            return alert("Invalid info!");
        }
        this.parent.mgr.removeOracle(
            this.address.get_value(), M())
            .then((tx)=>on_tx_ok(tx, "remove oracle"))
            .catch((err) =>on_tx_err(err, "remove oracle"));
    }

    find_raw_cp(cp) {
        let allcp = this.parent_state().cp;
        for (let c of allcp) {
            if (cp===c.pair) {
                return c.raw;
            }
        }
    }

    new_suscribe_cp(e, sub_or_unsub) {
        e.preventDefault();
        const state = this.get_state();
        if (!this.address.is_ok() || state.current_cp==="") {
            return alert("Invalid info!");
        }
        let mgr = this.parent.oracle_mgr;
        let rawcp = this.find_raw_cp(state.current_cp);

        let f = sub_or_unsub? mgr.suscribeCoinPair : mgr.unsuscribeCoinPair;

        f(this.address.get_value(), rawcp, M())
            .then((tx)=>on_tx_ok(tx, "oracle un/subscribe"))
            .catch((err) => on_tx_err(err, "oracle un/subscribe"));
    }

    new_stake(event) {
        event.preventDefault();
        if (!this.new__test_value()) {
            return;
        }
        if (!this.address.is_ok()) {
            return alert("Invalid info!");
        }
        let stake_bn = ethers.utils.parseEther(this.get_state().gen_amount);
        this.contract.addStake(this.address.get_value(), stake_bn, M())
            .then((tx) => {
                on_tx_ok(tx, "oracle add stake");
                this.setState({gen_amount: "0.0"});
            })
            .catch((err)=>on_tx_err(err, "oraccle add stake"));
    }

    new_iaddr(e, cb) {
        e.preventDefault();
        if (!this.iaddress.is_ok() || !this.address.is_ok()) {
            return alert("Invalid info!");
        }
        this.contract.setOracleName(
            this.address.get_value(), this.iaddress.get_value(), M())
            .then((tx)=>{
                on_tx_ok(tx, "oracle net-address change");
                if (cb) {
                    cb();
                }
            })
            .catch((err) => on_tx_err(err, "oracle net-address change"));
    }
}
