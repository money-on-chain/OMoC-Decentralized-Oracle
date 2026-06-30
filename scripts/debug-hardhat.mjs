import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const hardhatPackagePath = require.resolve('hardhat/package.json');
const hardhatPackage = require(hardhatPackagePath);
const hardhatCliPath = path.resolve(path.dirname(hardhatPackagePath), hardhatPackage.bin.hardhat);

await import(pathToFileURL(hardhatCliPath).href);
