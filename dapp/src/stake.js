import React from 'react';
import './index.css';
import { ethers } from 'ethers';
import { bigNumberifyAndFormatInt, isValid, HL, Grey, obj_get_props, TT, M, Adr, formatEther} from './helpers.js';
import {on_tx_ok, on_tx_err } from "./helpers.js";


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
        return this.parent_state().token;
    }
    sup_contract() {
        return this.contract;
    }

    dump_display(state) {
        return <div className="card mb-4 shadow-sm">
        <div className="card-body">
            <h5 className="card-title">Your token state </h5>
            <p className="card-text">
                <span>Allowance: {formatEther(state.allowance)} tokens for {this.contract_name}</span> <br/>
                <span>Balance: {formatEther(state.tokenBalance)} tokens</span>
            </p>

            <p className="card-text">
                <label>New value&nbsp; 
                    <input type="text" value={state.gen_amount}
                           onChange={(e) => this.gen_amount_chg(e)} name="gen_amount"/>
                </label> tokens.
            </p>

            <div className="d-flex justify-content-between align-items-center">
                <div className="btn-group">
                    <button type="button" className="btn btn-sm btn-outline-secondary"
                            onClick={(e) => this.new_allow(e)}>Allow
                    </button>
                    {this.dump_mint()}
                </div>
            </div>
        </div>
    </div>
    }

    dump_mint(){
        const ALLOW_MINT = process.env.REACT_APP_AllowMint;
        if(!ALLOW_MINT) {
            return <></> 
        }
        return <button type="button" className="btn btn-sm btn-outline-secondary"
        onClick={(e) => this.new_mint(e)}>Mint
        </button>
    }

    dump_contract_info(state) {
        return <h6 className="card-subtitle mb-2 text-muted">
        Address <span {... TT(this.parent_state().address)}>{Adr(this.parent_state().address)}</span></h6>
    }

    dump_buttons(state) {
        return                 <div className="card mb-4 shadow-sm">
        <div className="card-body">
            <h5 className="card-title">{this.contract_name} Info</h5>
            {this.dump_contract_info(state)}
            <p></p>
            {this.dump_button_group(state)}
        </div>
    </div>
    }

    dump_button_group(state) {
        return <div className="d-flex justify-content-between align-items-center">
        <div className="btn-group">
            <button type="button" className="btn btn-sm btn-outline-secondary"
                    onClick={(e) => this.new_stake(e)}>Stake
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary"
                    onClick={(e) => this.new_stop(e)}>Stop
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary"
                    onClick={(e) => this.new_withdraw(e)}>Withdraw
            </button>
        </div>
        <div className="btn-group">
            <button type="button" className="btn btn-sm btn-outline-secondary"
                    onClick={(e) => this.distribute(e)}>Distribute
            </button>
        </div>
    </div>
    }

    dump() {
        let state = this.get_state();
        return (
            <>
                {this.dump_display(state)}
                {this.dump_buttons(state)}
            </>
        )
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

    dump_contract_info(state) {
        return <>                         
    <h6 className="card-subtitle mb-2 text-muted">
        Address <span {... TT(this.parent_state().address)}>{Adr(this.parent_state().address)}</span> balance:
                    {HL(formatEther(state.stopped.add(state.staked)))} tokens</h6>

    <p className="card-text"> {Grey(<>
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
    </p>
    </>;
    }
}


export class OracleStake extends Stake {
    constructor(name, parent, contract, contract_name) {
        super(name, parent, contract, contract_name);

        this.address = new Address("oracle_address", this, {
            label:"Oracle address ",
            chk: isValid,
            get_value: x => x.toLowerCase(), 
            msg: (x) => " Invalid address: '"+x+"'"});

        this.iaddress = new Address("internet_address", this, {
            label:"Network address ",
            chk: (x) => x.startsWith("http://")||x.startsWith("https://"),
            msg: () => "Must start with http or https://"});
    }

    setCP(newpair) {
        this.setState({current_cp:newpair});
    }

    dump_options(optlist) {
        let state = this.get_state();
        return optlist.map(x => (
            <div className="form-check">
                <input className="form-check-input" type="radio" name="exampleRadios" onChange={this.setCP.bind(this, x.pair)} id="exampleRadios1" value="option1" checked={state.current_cp===x.pair}/>
                <label className="form-check-label" htmlFor="exampleRadios1">{x.pair.toString()}</label>
            </div>));
    }

    dump_contract_info(state) {
        let cp = this.parent_state().cp;
        return <>
            <p className="card-text">
                {this.address.dump()}<br/>
                {this.iaddress.dump()}
            </p>
            {cp? this.dump_options(cp): "(fetching)"}
        </>
    }

    init_state(st) {
        super.init_state(st);
        let xx = st[this.name];
        xx["current_cp"] = "";
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
        this.parent_state().oracle_manager.registerOracle(
            this.address.get_value(), this.iaddress.get_value(), stake_bn, M())
            .then((tx)=>on_tx_ok(tx, "register oracle"))
            .catch((err)=>on_tx_err(err, "register oracle"));
    }

    new_remove(e) {
        e.preventDefault();
        if (!this.address.is_ok()) {
            return alert("Invalid info!");
        }
        this.parent_state().oracle_manager.removeOracle(
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
        let mgr = this.parent_state().oracle_manager;
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

    new_iaddr(e) {
        e.preventDefault();
        if (!this.iaddress.is_ok() || !this.address.is_ok()) {
            return alert("Invalid info!");
        }
        this.contract.setOracleName(
            this.address.get_value(), this.iaddress.get_value(), M())
            .then((tx)=>on_tx_ok(tx, "oracle net-address change"))
            .catch((err) => on_tx_err(err, "oracle net-address change"));
    }

    dump_button_group(state) {
        return  <div className="d-flex justify-content-between align-items-center">
            <div className="btn-group btn-group-sm">
                <button type="button" className="btn btn-sm btn-outline-secondary"  onClick={(e) => this.new_register(e)}>Register
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary"
                            onClick={(e) => this.new_remove(e)}>Remove
                </button>
            </div>

            <div className="btn-group btn-group-sm">
                <button type="button" className="btn btn-sm btn-outline-secondary"
                        onClick={(e) => this.new_suscribe_cp(e, true)}>Suscribe
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary"
                        onClick={(e) => this.new_suscribe_cp(e, false)}>Unsuscribe
                </button>
            </div>

            <div className="btn-group btn-group-sm">
                <button type="button" className="btn btn-sm btn-outline-secondary"
                            onClick={(e) => this.new_stake(e)}>Stake
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary"
                            onClick={(e) => this.new_iaddr(e)}>Update net address
                </button>
            </div>
        </div>
    }
}
