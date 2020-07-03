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


async function main() {
    const needed_files = Object.keys(NEEDED_CONTRACTS);
    const cmp_func = (filename, x) => get_name(filename).toLowerCase() === x.toLowerCase();

    const destinationFolder = J(__dirname, '..', 'src', 'contracts');
    const sourceFolder = J(__dirname, '../../contracts/build/contracts');

    let files = [];
    console.log("Reading abis from", sourceFolder);
    console.log("\tSaving abis to ", destinationFolder);
    fs.readdirSync(sourceFolder).forEach(filename => {
        if (filename.toLowerCase().endsWith(".json") && needed_files.some(x => cmp_func(filename, x))) {
            files.push(filename);
        }
        if (!filename.toLowerCase().endsWith("_abi.json")) {
            const full_name = J(sourceFolder, filename);
            let data = JSON.parse(fs.readFileSync(full_name));
            const abi_filename = J(destinationFolder, get_name(filename) + "_abi.json");
            fs.writeFileSync(abi_filename, JSON.stringify({abi: data["abi"]}, null, 4));
        }
    });

    let network_id;
    if (process.argv.length > 2 && !isNaN(process.argv[2])) {
        network_id = parseInt(process.argv[2]);
    }
    const vars = [];
    for (let filename of files) {
        try {
            const full_name = J(sourceFolder, filename);
            const alias_key = needed_files.filter(x => cmp_func(filename, x));
            let data = fs.readFileSync(full_name);
            let obj = JSON.parse(data);
            const possible_networks = Object.keys(obj["networks"])
            if (!network_id) {
                network_id = possible_networks[0];
            }
            if (possible_networks.length != 1 || possible_networks[0] != network_id) {
                console.error("Invalid network id, use for example: ", possible_networks);
                process.exit(2);
            }
            const address = obj["networks"][network_id]["address"];
            const alias = NEEDED_CONTRACTS[alias_key];
            vars.push(`REACT_APP_${alias}=${address}`);

        } catch (err) {
            console.error(err);
            console.error("while processing: " + filename);
        }
    }

    vars.unshift("")
    vars.unshift("REACT_APP_NetworkID=" + network_id);
    vars.unshift("REACT_APP_RefreshTime=1000");

    console.log("----------- ENV FILE ------------")
    console.log(vars);
    const env_file = J(__dirname, '..', ".env.development.local");
    console.log("Saving abi", env_file);
    fs.writeFileSync(env_file, vars.join("\n"));

}


main()
    .then(() => console.error("done."))
    .catch(console.error);
