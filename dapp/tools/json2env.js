const testFolder = './src/contracts/';
const fs = require('fs');
const path = require('path');


async function StatFile(filename) {
    return new Promise((resolve, reject)=>{
        fs.stat(filename, (err, st) => {
            if (err!==null) {
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

async function ProcFile(fullname) {
    let data = fs.readFileSync(fullname);
    let obj = JSON.parse(data);
    //console.log( obj["networks"])
    for(let network_id in obj["networks"]) {
        // console.log("-----> ", network_id);
        // console.log("------------>", obj["networks"][network_id]["address"]);
        dump(get_name(fullname), network_id, obj["networks"][network_id]["address"]);
    }
}

async function main() {
    let files = [];

    fs.readdirSync(testFolder).forEach(filename => {
        if (filename.toLowerCase().endsWith(".json")) {
            files.push(J(testFolder, filename));
        }
    });
    for(let filename of files) {
        try {
            const st = await StatFile(filename);
            let is_file = st.isFile();
            if (is_file) {
                await ProcFile(filename);
            }
        } catch (err) {
            console.error(err);
            console.error("while processing: " + filename);
        }
    }      
}


main()
    .then( () => console.error("done."))
    .catch( console.error );
