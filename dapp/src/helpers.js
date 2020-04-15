import React from 'react';
import {ethers} from 'ethers';
import ReactTooltip from 'react-tooltip';


export function in_(x, an_array) {
    return -1!==an_array.indexOf(x);
}

export function addreq(a,b) {
    return a.toLowerCase()===b.toLowerCase();
}

export function array_rm(arr, el) {
    const index = arr.indexOf(el);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

export function is_empty_obj(obj) {
    return (Object.keys(obj).length === 0) && (obj.constructor === Object);
}

export function naive_copy(o) {
    return JSON.parse(JSON.stringify(o));
}

export function on_tx_ok(tx, msg) {
    let provider = window.ethereum
    alert(`Tx: ${tx["hash"]} broadcasted.`)
    console.log(`Tx ${tx["hash"]} (${msg}) issued.`);
    return awaitTx(provider, tx["hash"], msg);
}

export function on_tx_err(_err, msg) {
    console.error(_err);
    let err = get_err(_err);
    msg = `Error on: ${msg} : ` +  err.toString();
    alert(msg);
}

export function get_err(err) {
    try{
        if (err.data) {
            return err.data.message;
        }
        return err.message;
    }catch (e) {
        return err.toString();
    }
}

export async function getBalance(address) {
    const provider = window.ethereum;
    return new Promise((resolve, reject) => {
        try {
            provider.sendAsync({
                method: "eth_getBalance",
                params: [address],
            }, function (err, response) {
                if (err || response.error) {
                    reject(err || response.error);
                }
                resolve(ethers.utils.bigNumberify(response.result));
            });
        } catch(err) {
            reject(err);
        }
    });
}

export async function sendAsync(provider, fname, params) {
    return new Promise((resolve, reject) => {
        try {
            provider.sendAsync({
                method: fname, // 'eth_getTransactionByHash',
                params: params, //[txHash],
            }, function (err, response) {
                if (err || response.error) {
                    reject(err || response.error);
                }
                const transaction = response.result
                resolve(transaction);
            });
        } catch(err) {
            reject(err);
        }     
    });
}

export async function asleep(ms) {
    return new Promise((resolve, reject)=> {
        try {
            setTimeout(resolve, ms);
        }catch(err) {
            reject(err);
        }
    });
}

export async function awaitTx(provider, hash, msg) {
    //const notYet = 'response has no error or result';
    let finished = false;
    while(!finished){
        let tx = await sendAsync(provider, 'eth_getTransactionByHash', [hash]);
        if (tx.blockNumber!==null) {
            console.log(`Tx ${hash} / ${msg} included in block: ${tx.blockNumber}.`);
            let rec = await sendAsync(provider, 'eth_getTransactionReceipt', [hash]);
            if (rec.status==="0x0") {
                console.error(`Transaction ${hash} failed.`);
                console.error(`Receipt ${JSON.stringify(rec)}`);
                throw new Error("Transaction failed.")
            }
            finished=true;
        } else {
            await asleep(500);
        }
    }
}

export function check_or_ret(value, f, defvalue) {
    if (!defvalue) {
        defvalue = "-";
    }
    if ((value === undefined)||(value === null))
        return defvalue;
    try {
        return f(value);
    } catch (err) {
        return err.toString() + JSON.stringify(value);
    }
}

const loading = "(loading)";

export function parseBytes32String(x) {
    return check_or_ret(x, ethers.utils.parseBytes32String, loading);
}

export function formatEther(x) {
    return check_or_ret(x, ethers.utils.formatEther, loading);
}

export function bigNumberifyAndFormat(x) {
    return check_or_ret(x, (y) => ethers.utils.formatEther(ethers.utils.bigNumberify(y)), loading);
}

export function bigNumberifyAndFormatInt(x) {
    return check_or_ret(x, (y)=> ethers.utils.bigNumberify(y).toString(), loading);
}

export function get_props(contract_abi) {
    return contract_abi.filter(x => (x["type"] === "function"
        && x["stateMutability"] === "view"
        && x["inputs"].length === 0
        && !x["payable"]
    ));
}

export function obj_get_props(x) {
    return Object.getOwnPropertyNames(x);
}

export function SC(x) {
    return x.split(/(?=[A-Z])/).join(" ");
}

export function TT(x, classes, limit) {
    let ret = {
        className: "d-inline-block text-monospace "+classes,
        "data-toggle": "tooltip",
        title: x,
    }
    if (limit) {
       // ret["style"] = limit;
    }
    return ret;
}

export function Adr(addr) {
    return addr.slice(0, 8) + ".." + addr.slice(34);
}

export const id_f = (x) => x;

export function spantt (addr, mode) {
    let text_f=id_f, classes="";
    let limit = false;
    if (mode===undefined) mode="auto";
    addr = addr==null? "" : addr;
    switch(mode) {
    //     case "always":
    //         text_f = Adr;
    //         break
    //     case "never":
	//     break;
        default:
            //classes = "text-truncate";
            limit = "max-width: 30em;"
            break
    }
    let tt = TT(addr, classes, limit);
    tt['style'] = {fontWeight:'bold', 'color':'#000'};
    return <span {... tt}>
            {text_f(addr)}
        </span>
}

const RefreshTime = process.env.REACT_APP_RefreshTime?
                        process.env.REACT_APP_RefreshTime : 1000;

const Networks = {
    30: { gas: "0x387ee40", update: RefreshTime },
    31: { gas: "0x387ee40", update: RefreshTime },
    12341234: {update: 500},
}

export function getTimeout() {
    const ethereum = window['ethereum'];
    const network = ethereum.networkVersion;
    const netinfo = Networks[network];
    return netinfo.update;
}

export function M(x) {
    if ((x===undefined)||(x===null)) {
        x = { };
    }
    const ethereum = window['ethereum'];
    const network = ethereum.networkVersion;
    const netinfo = Networks[network];
    const newgas = netinfo? netinfo.gas : null;

    if(newgas) {
        x.gasPrice = newgas;
    }
    return x;
}

export const BS = {fontWeight: "bold", color: "#000"}
export const color22 = "#6c757d";

export function HL(X) {
    return (<span style={BS}>{X}</span>);
}

export function spanColor(X, color) {
    return <span style={{color: color}}>{X}</span>
}

export function Grey(X) {
    return spanColor(X, color22);
}

export function isValid(address) {
    return ((address.length === 42) && (address.startsWith("0x")));
}

export function isValidNS(ns) {
    return ns.startsWith("http://")||ns.startsWith("https://");
}



export const align_center = {className: "text-center"};
export const align_left = {className: "text-left"};
export const align_right = {className: "text-right"};

export const all_what = (what) => ( (idx)=>what )
export const all_center = all_what(align_center)

/*
Table Options:
    extra_classes: ""  (for table)
    nonresponsive: false  (default)
    incidx: true  (include index)
    alignf: (idx) => align_center  
    headalignf: " "  for table heading

    // -- both next for tooltips:
    rowttf =  (row) -> tooltip content
    odata = original data
*/

export function Table(heads, data, opts) {
    let RESP;
    let className = "table ";  // table-bordered
    const responsive =opts? (opts.nonresponsive ? !opts.nonresponsive : true) : true;
    const extra_classes = opts? (opts.classes? opts.classes : "") : "";
    let st = Math.random().toString().replace(".", "");
    let row2tt = opts? ( opts.row2ttf? opts.row2ttf : null) : null;
    let odata = opts? (opts.odata? opts.odata : null) : null;
    let incidx = opts? (opts.incidx!==undefined?opts.incidx:true) : true;
    let col_align = opts? (opts.alignf!==undefined? opts.alignf: all_center): all_center;

    let headalign = opts? (opts.headalignf!==undefined? opts.headalignf: all_center): all_center;
    let rowclick = opts? (opts.rowclick? opts.rowclick : null) : null;
    let rowattrs = opts? (opts.rowattrs? opts.rowattrs : null) : null;

    className += " "+extra_classes;

    if (responsive) {
        RESP = (x) => (<div className="table-responsive">{x}</div>);
    } else {
        RESP = (x) => (<>{x}</>);
    }

    function _attrs(idx) {
        if(odata && row2tt) {
            let row = odata[idx];
            let address = row.oracle;
            return {"data-tip": true, "data-for":st+address};
        }
        return {};
    }

    function attrs(idx) {
        let temp = _attrs(idx);
        if (rowclick) {
            temp["onClick"] = (e)=>{
                let tidx =  e.currentTarget.rowIndex-1;
                let data = odata? odata[tidx] : null;
                rowclick(e, tidx, data);}
        }
        if(rowattrs) {
            temp = rowattrs(idx, temp);
        }
        return temp;
    }

    function gen_tooltips() {
        if(odata && row2tt) {
            return odata.map(row=><ReactTooltip id={st+row.oracle} aria-haspopup='true' backgroundColor='#343a40ff' effect='solid'>
            {row2tt(row)}
        </ReactTooltip>)
        } else return <></>
    }

    return RESP(<>
        {gen_tooltips()}
        <table className={className}>
            <thead>
                <tr>{heads.map((x,col)=><th scope="col" {... headalign(col)}>{x}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.map((row, idx) => {
                    let ini = incidx? (1+idx).toString() :row[0];
                    if(!incidx) { row = row.slice(1) }
                    return (
                    <tr {... attrs(idx)}>
                        <th scope="row" {... col_align(0)}>{ini}</th>
                        {row.map((field, col) => <td {... col_align(col)}>{field}</td> )}
                    </tr>)
                })}
            </tbody>
        </table></>);
}




export class Tabs {
    // {
    //      name: str
    //      data: jsx content
    //      fn: dump jsx content
    // }
    constructor(tabs, current, cb_newstate, wrap) {
        this.tabs = tabs;
        this.current = current;
        this.cb_newstate = cb_newstate;
        this.wrap = wrap;
    }

    dump_header() {
        if (!this.current) {
            this.current = this.tabs[0].name;
        }
        const classes = (name) => name===this.current?
                                    {className:"nav-link active"}:
                                    {className:"nav-link"};
        return (
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            {this.tabs.map((tab,idx)=><>
                <li className="nav-item">
                  <a href={null_href()}
                     onClick={(e) => {this.cb_newstate(tab.name)}}
                   { ... classes(tab.name)}
                  >{tab.name}</a>
                </li>
            </>)}
          </ul>
        </div>)
    }

    get_current() {
        for(let tab of this.tabs) {
            if (tab.name===this.current) {
                return tab;
            }
        }
        return this.tabs[0];
    }

    dump_view(state) {
        let cur = this.get_current();
        return cur.fn(state, cur);
    }

    dump() {
        let f;
        if (this.wrap) {
            f = (x) => <div className="card">{x}</div>
        } else {
            f = (x) => x;
        }
        return f(<>
            {this.dump_header()}
            {this.dump_view()}
            </>);
    }
}

export function null_href() {
    let f = (x)=> "ript:vo";

    return "javasc"+f()+"id(0)";
}
