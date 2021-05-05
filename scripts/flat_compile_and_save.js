'use strict';
/*
    This script get the flat version of InfoGetter and generate a truffle artifact InfoGetterFlat.
 */
const { flatten } = require('@coinfabrik/solidity-flattener');
const Config = require('@truffle/config');
const { Compile } = require('@truffle/compile-solidity');
const Artifactor = require('@truffle/artifactor');
const { Shims } = require('@truffle/compile-common');
const path = require('path');

async function main(contract) {
    const options = Config.detect();
    const artifactor = new Artifactor(options.contracts_build_directory);

    const contractPath = path.parse(contract);
    let source = await flatten(contract);
    // To avoid a warning
    if (!source.startsWith('// SPDX')) {
        source = '// SPDX-License-Identifier: UNLICENSED\n' + source;
    }
    const result = await Compile.sources({
        sources: { [contract]: source },
        options,
    });
    const contractCompiled = result.compilations[0].contracts.find(
        (x) => x.contractName === contractPath.name,
    );
    const artifact = Shims.NewToLegacy.forContract(contractCompiled);
    const dest = contractPath.name + 'Flat';
    artifact.contract_name = dest;
    await artifactor.save(artifact);
}

main(process.argv[2]).catch((err) => console.error(err));
