import React from 'react';
import './index.css';
import {ethers} from 'ethers';
import {bigNumberifyAndFormatInt, isValid, isValidNS, HL, obj_get_props, M, formatEther} from './helpers.js';
import {on_tx_ok, on_tx_err} from "./helpers.js";
import {null_href, Tabs} from "./helpers";


const ALLOW_MINT = process.env.REACT_APP_AllowMint;


export class MyBase {
    constructor(name, parent) {
        this.name = name;
        this.parent = parent;
    }

    get_state() {
        return this.parent_state()[this.name];
    }

    parent_state() {
        return this.parent.get_state();
    }

    setState(x, cb) {
        let st = this.parent_state()[this.name]
        for (let p of obj_get_props(x)) {
            st[p] = x[p];
        }
        let xx = {}
        xx[this.name] = st;
        this.parent.setState(xx, cb);
    }
}


export class Address extends MyBase {
    constructor(name, parent, opts) {
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
        this.on_change({target: {value: value}})
    }

    get_value() {
        let f = this.opts["get_value"] ? this.opts["get_value"] : (x) => x;
        return f(this.get_state()["value"]);
    }

    is_ok() {
        let f = this.opts["chk"] ? this.opts["chk"] : () => true;
        return f(this.get_value());
    }

    fail_msg() {
        let f = this.opts["msg"] ? this.opts["msg"] : (x) => `Invalid value ${x}`;
        return f(this.get_value());
    }

    is_default() {
        return this.get_value() === "";
    }

    dump_with_addr_check(parent_state) {
        let msg = !this.is_ok() && !this.is_default() ?
            <span style={{color: "#ff0000"}}>{" (" + this.fail_msg() + ")"}</span> : null;
        const state = this.get_state();
        const val = this.get_value();
        if (val && parent_state && msg === null) {
            const found = parent_state["mgr_oracle_reg_info"].some(x => x.address.toLowerCase() === val.toLowerCase());
            if (parent_state["mgr_oracle_reg_info"] && found) {
                msg = <span style={{color: "#ff0000"}}>THIS ORACLE IS ALREADY REGISTERED</span>;
            } else if (parent_state["address"] && val === parent_state["address"]) {
                msg = <span style={{color: "#ff9966"}}>We suggest to avoid using owner address</span>;
            }
        }
        return <><label>{this.opts.label}
            <input type="text" value={state.value}
                   onChange={(e) => this.on_change(e)} name="address-{this.name}"/> {msg === null ? <></> : msg}
        </label><br/></>
    }

    dump() {
        let state = this.get_state();
        let msg = !this.is_ok() && !this.is_default() ? <span>{" (" + this.fail_msg() + ")"}</span> : <></>;

        return <><label>{this.opts.label}
            <input type="text" value={state.value}
                   onChange={(e) => this.on_change(e)} name="address-{this.name}"/> {msg}
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
        st[this.name] = {
            allowance: null,
            gen_amount: "0",
            view: 0,
        }
    }

    async update() {
        try {
            let allowance = await this.token().allowance(this.parent_state().address,
                this.sup_contract().address);
            this.setState({allowance});
        } catch (err) {
            console.error(err);
        }
    }

    token() {
        return this.parent.token;
    }

    sup_contract() {
        return this.contract;
    }

    _dump_input_amount(state, label) {
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
        return <a href={null_href()} onClick={(e) => cb(e)}
                  className="btn btn-primary">{text}</a>
    }

    dump_contract_info(state) {
        return <>
            Current allowance:&nbsp;
            {HL(formatEther(state.allowance))} tokens.
        </>;
    }

    _card_text(X) {
        return <p className="card-text">
            <span className="card-subtitle mb-2 text-muted">
                {X}
            </span>
        </p>
    }

    _dump_card_template(state, X) {
        return <div className="card-body">
            {/* <h5 className="card-title">Special title treatment</h5> */}
            {this._card_text(this.dump_contract_info(state))}
            {X}
        </div>
    }

    _dump_mint() {
        const state = this.get_state();
        return this._dump_card_template(state, <>
            {this._card_text(this._dump_input_amount(state, "Amount to mint"))}
            {this._dump_g_button("mint", (e) => this.new_mint(e))}
        </>)
    }

    _dump_allow() {
        const state = this.get_state();
        return this._dump_card_template(state, <>
            {this._card_text(this._dump_input_amount(state, "Amount to allow"))}
            {this._dump_g_button("allow", (e) => this.new_allow(e))}
        </>)
    }

    _dump_stake() {
        const state = this.get_state();
        return this._dump_card_template(state, <>
            {this._card_text(this._dump_input_amount(state, "Amount to stake"))}
            {this._dump_g_button("stake", (e) => this.new_stake(e))}
        </>)
    }

    views() {
        let mint = {name: "0 Mint", fn: this._dump_mint};
        let views = this.Views;
        if (ALLOW_MINT) {
            views = [mint].concat(views);
        }
        for (let v of views) {
            v.fn = v.fn.bind(this);
        }
        return views;
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
            .then((tx) => on_tx_ok(tx, "distribute"))
            .catch((err) => on_tx_err(err, "distribute"));
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
            if (x === undefined) {
                x = ''
            }
            ;
            ethers.utils.parseEther(x);
            return true;
        } catch (err) {
            alert("Invalid amount: '" + x + "'.");
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
            .then((tx) => on_tx_ok(tx, "token allow oracle"))
            .catch((err) => on_tx_err(err, "token allow oracle"));
    }

    new_stake(event) {
        event.preventDefault();
        if (!this.new__test_value()) {
            return;
        }
        let stake_bn = ethers.utils.parseEther(this.get_state().gen_amount);
        this.sup_contract().addStake(stake_bn, M())
            .then((tx) => on_tx_ok(tx, "supporter add stake"))
            .catch((err) => on_tx_err(err, "supporter add stake"));
    }

    new_stop(event) {
        event.preventDefault();
        this.sup_contract().stop(M())
            .then((tx) => on_tx_ok(tx, "stop"))
            .catch((err) => on_tx_err(err, "stop"));
    }

    new_withdraw(event) {
        event.preventDefault();
        //let stake_bn = ethers.utils.parseEther(this.get_state().gen_amount);
        this.sup_contract().withdraw(M())
            .then((tx) => on_tx_ok(tx, "withdraw"))
            .catch((err) => {
                debugger;
                on_tx_err(err, "withdraw")
            });
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
        this.dump_contract_info = this.dump_contract_info.bind(this);
        this._dump_stake = this._dump_stake.bind(this);
    }

    init_state(st) {
        super.init_state(st);
        let xx = st[this.name];
        xx.staked = null;
        xx.stakedInBlock = null;
        xx.stopped = null;
        xx.stoppedInBlock = null;
        xx.minStayBlocks = null;
        xx.minStopBlocks = null;
    }

    dump_contract_info(state) {
        return <>
            {super.dump_contract_info(state)}<br/>
            Detail:
            <br/>
            Staked: {HL(formatEther(state.staked))} tokens at
            block {bigNumberifyAndFormatInt(state.stakedInBlock)} you&quot;ll be abled to stop at block
            {" " + bigNumberifyAndFormatInt(state.stakedInBlock ? state.stakedInBlock.add(state.minStayBlocks) :
                null)}.
            <br/>
            Stopped: {HL(formatEther(state.stopped))} tokens at
            block {bigNumberifyAndFormatInt(state.stoppedInBlock)} you&quot;ll be abled to withdraw
            {" " + bigNumberifyAndFormatInt(state.minStopBlocks)} blocks after stop.
            <br/>
            Total in stake: {HL(formatEther(state.stopped ? state.stopped.add(state.staked) : null))} tokens.
            (staked+stopped)
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
        } catch (err) {
            console.error(err)
        }
    }

    _dump_stop() {
        const state = this.get_state();
        return this._dump_card_template(state, <>
            {this._dump_g_button("stop", (e) => this.new_stop(e))}
        </>)
    }

    _dump_withdraw() {
        const state = this.get_state();
        return this._dump_card_template(state, <>
            {this._dump_g_button("withdraw", (e) => this.new_withdraw(e))}
        </>)
    }

    Views = [
        {name: "1 Allow", fn: this._dump_allow},
        {name: "2 Stake", fn: this._dump_stake},
        {name: "Stop", fn: this._dump_stop},
        {name: "Withdraw", fn: this._dump_withdraw}
    ]
}


export class OracleStake extends Stake {
    Views = [
        {name: "1 Allow", fn: this._dump_allow},
        {name: "2 Register", fn: this._dump_register},
    ];

    _dump_register() {
        const state = this.get_state();
        return this._dump_card_template(state, <>
            {this._card_text(<>
                {this.address.dump_with_addr_check(this.parent_state())}
                {this.iaddress.dump()}
                {this._dump_input_amount(state, "Stake")}
            </>)}
            {this._dump_g_button("register", (e) => this.new_register(e))}
        </>)
    }

    constructor(name, parent, contract, contract_name) {
        super(name, parent, contract, contract_name);
        this.address = new Address("oracle_address", this, {
            label: "Oracle address ",
            chk: isValid,
            get_value: x => x.toLowerCase(),
            msg: (x) => " Invalid address: '" + x + "'"
        });

        this.iaddress = new Address("internet_address", this, {
            label: "Network address ",
            chk: isValidNS,
            msg: () => "Must start with http or https://"
        });
    }

    init_state(st) {
        super.init_state(st);
        let xx = st[this.name];
        this.address.init_state(xx);
        this.iaddress.init_state(xx);
    }

    new_register(e) {
        e.preventDefault();
        if (!this.new__test_value()) {
            return;
        }
        const state = this.get_state();
        if (!this.address.is_ok() || !this.iaddress.is_ok()) {
            return alert("Invalid info!");
        }
        let stake_bn = ethers.utils.parseEther(state.gen_amount);
        this.parent.oracle_mgr.registerOracle(
            this.address.get_value(), this.iaddress.get_value(), stake_bn, M())
            .then((tx) => on_tx_ok(tx, "register oracle"))
            .catch((err) => on_tx_err(err, "register oracle"));
    }
}
