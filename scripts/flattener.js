#!/usr/bin/env node
/* global Promise, require, __dirname */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function flatten(contractSource) {
    return new Promise((resolv, reject) => {
        const stdout = [];
        const stderr = [];
        const flattener = path.join(__dirname, 'flattener.py');
        const python = spawn('python3', [flattener, contractSource]);
        python.on('exit', (code) => {
            if (stderr.length > 0 || code !== 0) {
                reject('error in child : ' + code + stderr.join(''));
                return;
            }
            resolv(stdout.join(''));
        });
        python.stdout.on('data', (data) => {
            stdout.push(data);
        });
        python.stderr.on('data', (data) => {
            stderr.push(data);
        });
        python.stdin.setEncoding('utf-8');
        // python.stdin.write("console.log('Hello from PhantomJS')\n");
        python.stdin.end();
    });
}

if (module === require.main) {
    if (process.argv.length !== 3) {
        console.error(`Usage: ${path.parse(process.argv[1]).base} contract_name.sol`);
        return 1;
    }
    const filePath = path.normalize(process.argv[2]);
    if (!fs.existsSync(filePath)) {
        console.error('Invalid file name', filePath);
        return 2;
    }
    flatten(filePath)
        .then((source) => console.log(source))
        .catch((err) => console.error(err));
}

module.exports = {
    flatten,
};
