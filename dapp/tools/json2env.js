const testFolder = './src/contracts/';
const fs = require('fs');
const path = require('path');
const NEEDED_CONTRACTS = {
    "OracleManager": "OracleManager",
    "EternalStorageGobernanza": "Registry",
    "SupportersVested": "SupportersVested",
    "SupportersWhitelisted": "SupportersWhitelisted"
};


async function StatFile(filename) {
    return new Promise((resolve, reject) => {
        fs.stat(filename, (err, st) => {
            if (err !== null) {
                return reject(err)
            }
            resolve(st);
        });
    });
}

const J = path.join;


function get_name(filename) {
    let x = filename.split(path.sep).pop();
    return x.split(".")[0];
}

function dump(contract, network, address) {
    //console.log(`REACT_APP_${contract}_${network}=${address}`);
    console.log(`REACT_APP_${contract}=${address}`);
}

async function ProcFile(network_id, fullname, alias) {
    let data = fs.readFileSync(fullname);
    let obj = JSON.parse(data);
    //console.log( obj["networks"])
    // console.log("-----> ", network_id);
    // console.log("------------>", obj["networks"][network_id]["address"]);
    if (!(network_id in obj["networks"])) {
        console.error("Invalid network id, use for example: ", Object.keys(obj["networks"]));
        process.exit(2);
    }
    dump(alias, network_id, obj["networks"][network_id]["address"]);
}

async function main() {
    if (process.argv.length != 3 || isNaN(process.argv[2])) {
        console.error("Usage script network_id\n for example 31, 12341234");
        process.exit(1);
    }
    const network_id = parseInt(process.argv[2]);
    const needed_files = Object.keys(NEEDED_CONTRACTS);
    const cmp_func = (filename, x) => get_name(filename).toLowerCase() === x.toLowerCase();

    let files = [];
    fs.readdirSync(testFolder).forEach(filename => {
        if (filename.toLowerCase().endsWith(".json") && needed_files.some(x => cmp_func(filename, x))) {
            files.push(filename);
        }
        if (false && !filename.toLowerCase().endsWith("_abi.json")) {
            const full_name = J(testFolder, filename);
            let data = JSON.parse(fs.readFileSync(full_name));
            const abi_filename = J(testFolder, get_name(filename) + "_abi.json");
            console.log("Reading", full_name, "Saving abi", abi_filename);
            fs.writeFileSync(abi_filename, JSON.stringify(data["abi"], null, 4));
        }
    });
    console.log("----------- ENV FILE ------------")
    console.log("REACT_APP_AllowMint=true");
    console.log("REACT_APP_RefreshTime=1000");
    console.log("REACT_APP_NetworkID=" + network_id);
    console.log("")
    for (let filename of files) {
        try {
            const full_name = J(testFolder, filename);
            const st = await StatFile(full_name);
            let is_file = st.isFile();
            if (is_file) {
                const alias_key = needed_files.filter(x => cmp_func(filename, x));
                await ProcFile(network_id, full_name, NEEDED_CONTRACTS[alias_key]);
            }
        } catch (err) {
            console.error(err);
            console.error("while processing: " + filename);
        }
    }
}


main()
    .then(() => console.error("done."))
    .catch(console.error);
