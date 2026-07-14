import { type Hex } from 'viem';
import type { Address } from 'viem';
import type { ContractOf, Deployer, NetworkHelpers, Viem, WalletClient } from 'ts-test-helpers';
export declare const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export declare const ADDRESS_ONE = "0x0000000000000000000000000000000000000001";
export declare const MAX_UINT256: bigint;
export declare function addressFromNumber(value: number): Address;
export type OracleDefinition = {
    owner: WalletClient;
    signer?: WalletClient;
    address: Address;
    url?: string;
    name: string;
};
export type OracleStakeData = {
    name: string;
    stake: bigint;
    account: WalletClient;
    owner: WalletClient;
    address: Address;
};
export declare function toOracleDefinition(s: OracleStakeData): OracleDefinition;
export declare function encodeCoinPair(name: string): `0x${string}`;
export declare function decodeCoinPair(value: string): string;
export declare function createGovernor(deployer: Deployer, owner: WalletClient): Promise<{
    addr: `0x${string}`;
    address: `0x${string}`;
    governor: {
        read: {
            isAuthorizedChanger: (args: readonly [`0x${string}`], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "isAuthorizedChanger", readonly [`0x${string}`]>, "address" | "abi" | "args" | "functionName">> | undefined) => Promise<boolean>;
            isOwner: (options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "isOwner", readonly []>, "address" | "abi" | "args" | "functionName">> | undefined) => Promise<boolean>;
            owner: (options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "owner", readonly []>, "address" | "abi" | "args" | "functionName">> | undefined) => Promise<`0x${string}`>;
        };
        estimateGas: {
            initialize: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "initialize", readonly [] | readonly [sender: `0x${string}`], import("viem").Chain>, "address" | "abi" | "args" | "functionName">>] | [args: readonly [sender: `0x${string}`], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "initialize", readonly [] | readonly [sender: `0x${string}`], import("viem").Chain>, "address" | "abi" | "args" | "functionName">>]) => Promise<import("viem").EstimateContractGasReturnType>;
            executeChange: (args: readonly [`0x${string}`], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "executeChange", readonly [`0x${string}`], import("viem").Chain>, "address" | "abi" | "args" | "functionName">>) => Promise<import("viem").EstimateContractGasReturnType>;
            renounceOwnership: (options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "renounceOwnership", readonly [], import("viem").Chain>, "address" | "abi" | "args" | "functionName">>) => Promise<import("viem").EstimateContractGasReturnType>;
            transferOwnership: (args: readonly [newOwner: `0x${string}`], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "transferOwnership", readonly [newOwner: `0x${string}`], import("viem").Chain>, "address" | "abi" | "args" | "functionName">>) => Promise<import("viem").EstimateContractGasReturnType>;
        } & {
            initialize: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "initialize", readonly [] | readonly [sender: `0x${string}`], import("viem").Chain>, "address" | "abi" | "args" | "functionName">> | undefined] | [args: readonly [sender: `0x${string}`], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "initialize", readonly [] | readonly [sender: `0x${string}`], import("viem").Chain>, "address" | "abi" | "args" | "functionName">> | undefined]) => Promise<import("viem").EstimateContractGasReturnType>;
            executeChange: (args: readonly [`0x${string}`], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "executeChange", readonly [`0x${string}`], import("viem").Chain>, "address" | "abi" | "args" | "functionName">> | undefined) => Promise<import("viem").EstimateContractGasReturnType>;
            renounceOwnership: (options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "renounceOwnership", readonly [], import("viem").Chain>, "address" | "abi" | "args" | "functionName">> | undefined) => Promise<import("viem").EstimateContractGasReturnType>;
            transferOwnership: (args: readonly [newOwner: `0x${string}`], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "transferOwnership", readonly [newOwner: `0x${string}`], import("viem").Chain>, "address" | "abi" | "args" | "functionName">> | undefined) => Promise<import("viem").EstimateContractGasReturnType>;
        };
        simulate: {
            initialize: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "initialize", readonly [] | readonly [sender: `0x${string}`], import("viem").Chain, chainOverride, accountOverride>, "address" | "abi" | "args" | "functionName"> | undefined] | [args: readonly [sender: `0x${string}`], options?: Omit<import("viem").SimulateContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "initialize", readonly [] | readonly [sender: `0x${string}`], import("viem").Chain, chainOverride, accountOverride>, "address" | "abi" | "args" | "functionName"> | undefined]) => Promise<import("viem").SimulateContractReturnType<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "initialize", readonly [] | readonly [sender: `0x${string}`], import("viem").Chain, import("viem").Account, chainOverride, accountOverride>>;
            executeChange: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | Address | undefined = undefined>(args: readonly [`0x${string}`], options?: Omit<import("viem").SimulateContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "executeChange", readonly [`0x${string}`], import("viem").Chain, chainOverride, accountOverride>, "address" | "abi" | "args" | "functionName"> | undefined) => Promise<import("viem").SimulateContractReturnType<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "executeChange", readonly [`0x${string}`], import("viem").Chain, import("viem").Account, chainOverride, accountOverride>>;
            renounceOwnership: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | Address | undefined = undefined>(options?: Omit<import("viem").SimulateContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "renounceOwnership", readonly [], import("viem").Chain, chainOverride, accountOverride>, "address" | "abi" | "args" | "functionName"> | undefined) => Promise<import("viem").SimulateContractReturnType<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "renounceOwnership", readonly [], import("viem").Chain, import("viem").Account, chainOverride, accountOverride>>;
            transferOwnership: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | Address | undefined = undefined>(args: readonly [newOwner: `0x${string}`], options?: Omit<import("viem").SimulateContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "transferOwnership", readonly [newOwner: `0x${string}`], import("viem").Chain, chainOverride, accountOverride>, "address" | "abi" | "args" | "functionName"> | undefined) => Promise<import("viem").SimulateContractReturnType<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "transferOwnership", readonly [newOwner: `0x${string}`], import("viem").Chain, import("viem").Account, chainOverride, accountOverride>>;
        };
        createEventFilter: {
            OwnershipTransferred: <const args extends {
                previousOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
                newOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
            } | undefined, strict extends boolean | undefined = undefined>(args: {
                previousOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
                newOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
            } | ({
                previousOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
                newOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
            } extends infer T ? T extends {
                previousOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
                newOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
            } ? T extends args ? Readonly<args> : never : never : never), options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined) => Promise<import("viem").CreateContractEventFilterReturnType<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "OwnershipTransferred", args, strict>>;
        };
        getEvents: {
            OwnershipTransferred: (args?: {
                previousOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
                newOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
            } | undefined, options?: {
                blockHash?: `0x${string}` | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined) => Promise<import("viem").GetContractEventsReturnType<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "OwnershipTransferred">>;
        };
        watchEvent: {
            OwnershipTransferred: (args: {
                previousOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
                newOwner?: `0x${string}` | readonly `0x${string}`[] | null | undefined;
            }, options: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                fromBlock?: bigint | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<[{
                    inputs: [];
                    stateMutability: "nonpayable";
                    type: "constructor";
                }, {
                    anonymous: false;
                    inputs: [{
                        "indexed": true;
                        "internalType": "address";
                        "name": "previousOwner";
                        "type": "address";
                    }, {
                        "indexed": true;
                        "internalType": "address";
                        "name": "newOwner";
                        "type": "address";
                    }];
                    name: "OwnershipTransferred";
                    type: "event";
                }, {
                    inputs: [{
                        "internalType": "contract ChangeContract";
                        "name": "changeContract";
                        "type": "address";
                    }];
                    name: "executeChange";
                    outputs: [];
                    stateMutability: "nonpayable";
                    type: "function";
                }, {
                    inputs: [];
                    name: "initialize";
                    outputs: [];
                    stateMutability: "nonpayable";
                    type: "function";
                }, {
                    inputs: [{
                        "internalType": "address";
                        "name": "sender";
                        "type": "address";
                    }];
                    name: "initialize";
                    outputs: [];
                    stateMutability: "nonpayable";
                    type: "function";
                }, {
                    inputs: [{
                        "internalType": "address";
                        "name": "_changer";
                        "type": "address";
                    }];
                    name: "isAuthorizedChanger";
                    outputs: [{
                        "internalType": "bool";
                        "name": "";
                        "type": "bool";
                    }];
                    stateMutability: "view";
                    type: "function";
                }, {
                    inputs: [];
                    name: "isOwner";
                    outputs: [{
                        "internalType": "bool";
                        "name": "";
                        "type": "bool";
                    }];
                    stateMutability: "view";
                    type: "function";
                }, {
                    inputs: [];
                    name: "owner";
                    outputs: [{
                        "internalType": "address";
                        "name": "";
                        "type": "address";
                    }];
                    stateMutability: "view";
                    type: "function";
                }, {
                    inputs: [];
                    name: "renounceOwnership";
                    outputs: [];
                    stateMutability: "nonpayable";
                    type: "function";
                }, {
                    inputs: [{
                        "internalType": "address";
                        "name": "newOwner";
                        "type": "address";
                    }];
                    name: "transferOwnership";
                    outputs: [];
                    stateMutability: "nonpayable";
                    type: "function";
                }], "OwnershipTransferred", undefined>;
                poll?: true | undefined | undefined;
            }) => import("viem").WatchContractEventReturnType;
        };
        write: {
            initialize: <chainOverride extends import("viem").Chain | undefined, options extends import("viem").UnionOmit<import("viem").WriteContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "initialize", readonly [] | readonly [sender: `0x${string}`], import("viem").Chain, import("viem").Account, chainOverride>, "address" | "abi" | "args" | "functionName"> extends infer T ? { [K in keyof T]: T[K]; } : never>(...parameters: [options?: options | undefined] | [args: readonly [sender: `0x${string}`], options?: options | undefined]) => Promise<import("viem").WriteContractReturnType>;
            executeChange: <chainOverride extends import("viem").Chain | undefined, options extends import("viem").UnionOmit<import("viem").WriteContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "executeChange", readonly [`0x${string}`], import("viem").Chain, import("viem").Account, chainOverride>, "address" | "abi" | "args" | "functionName"> extends infer T ? { [K in keyof T]: T[K]; } : never>(args: readonly [`0x${string}`], options?: options | undefined) => Promise<import("viem").WriteContractReturnType>;
            renounceOwnership: <chainOverride extends import("viem").Chain | undefined, options extends import("viem").UnionOmit<import("viem").WriteContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "renounceOwnership", readonly [], import("viem").Chain, import("viem").Account, chainOverride>, "address" | "abi" | "args" | "functionName"> extends infer T ? { [K in keyof T]: T[K]; } : never>(options?: options | undefined) => Promise<import("viem").WriteContractReturnType>;
            transferOwnership: <chainOverride extends import("viem").Chain | undefined, options extends import("viem").UnionOmit<import("viem").WriteContractParameters<[{
                inputs: [];
                stateMutability: "nonpayable";
                type: "constructor";
            }, {
                anonymous: false;
                inputs: [{
                    "indexed": true;
                    "internalType": "address";
                    "name": "previousOwner";
                    "type": "address";
                }, {
                    "indexed": true;
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "OwnershipTransferred";
                type: "event";
            }, {
                inputs: [{
                    "internalType": "contract ChangeContract";
                    "name": "changeContract";
                    "type": "address";
                }];
                name: "executeChange";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "sender";
                    "type": "address";
                }];
                name: "initialize";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "_changer";
                    "type": "address";
                }];
                name: "isAuthorizedChanger";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "isOwner";
                outputs: [{
                    "internalType": "bool";
                    "name": "";
                    "type": "bool";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "owner";
                outputs: [{
                    "internalType": "address";
                    "name": "";
                    "type": "address";
                }];
                stateMutability: "view";
                type: "function";
            }, {
                inputs: [];
                name: "renounceOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }, {
                inputs: [{
                    "internalType": "address";
                    "name": "newOwner";
                    "type": "address";
                }];
                name: "transferOwnership";
                outputs: [];
                stateMutability: "nonpayable";
                type: "function";
            }], "transferOwnership", readonly [newOwner: `0x${string}`], import("viem").Chain, import("viem").Account, chainOverride>, "address" | "abi" | "args" | "functionName"> extends infer T ? { [K in keyof T]: T[K]; } : never>(args: readonly [newOwner: `0x${string}`], options?: options | undefined) => Promise<import("viem").WriteContractReturnType>;
        };
        address: `0x${string}`;
        abi: [{
            inputs: [];
            stateMutability: "nonpayable";
            type: "constructor";
        }, {
            anonymous: false;
            inputs: [{
                "indexed": true;
                "internalType": "address";
                "name": "previousOwner";
                "type": "address";
            }, {
                "indexed": true;
                "internalType": "address";
                "name": "newOwner";
                "type": "address";
            }];
            name: "OwnershipTransferred";
            type: "event";
        }, {
            inputs: [{
                "internalType": "contract ChangeContract";
                "name": "changeContract";
                "type": "address";
            }];
            name: "executeChange";
            outputs: [];
            stateMutability: "nonpayable";
            type: "function";
        }, {
            inputs: [];
            name: "initialize";
            outputs: [];
            stateMutability: "nonpayable";
            type: "function";
        }, {
            inputs: [{
                "internalType": "address";
                "name": "sender";
                "type": "address";
            }];
            name: "initialize";
            outputs: [];
            stateMutability: "nonpayable";
            type: "function";
        }, {
            inputs: [{
                "internalType": "address";
                "name": "_changer";
                "type": "address";
            }];
            name: "isAuthorizedChanger";
            outputs: [{
                "internalType": "bool";
                "name": "";
                "type": "bool";
            }];
            stateMutability: "view";
            type: "function";
        }, {
            inputs: [];
            name: "isOwner";
            outputs: [{
                "internalType": "bool";
                "name": "";
                "type": "bool";
            }];
            stateMutability: "view";
            type: "function";
        }, {
            inputs: [];
            name: "owner";
            outputs: [{
                "internalType": "address";
                "name": "";
                "type": "address";
            }];
            stateMutability: "view";
            type: "function";
        }, {
            inputs: [];
            name: "renounceOwnership";
            outputs: [];
            stateMutability: "nonpayable";
            type: "function";
        }, {
            inputs: [{
                "internalType": "address";
                "name": "newOwner";
                "type": "address";
            }];
            name: "transferOwnership";
            outputs: [];
            stateMutability: "nonpayable";
            type: "function";
        }];
    };
    registerCoinPair: (manager: ContractOf<"OracleManager">, coinPair: string, address: string) => Promise<`0x${string}`>;
    mint: (tokenAddr: string, addr: string, quantity: bigint) => Promise<`0x${string}`>;
    execute: (contract: {
        address: Address;
    }) => Promise<`0x${string}`>;
}>;
export declare function getLatestBlock(viem: Viem): Promise<bigint>;
export declare function increaseTime(networkHelpers: NetworkHelpers, seconds: number | bigint): Promise<void>;
export declare function increaseTimeTo(networkHelpers: NetworkHelpers, timestamp: number | bigint): Promise<void>;
type RoundLockReadable = {
    read: {
        getRoundInfo: () => Promise<readonly unknown[]>;
    };
};
export declare function mineUntilNextRound(networkHelpers: NetworkHelpers, viem: Viem, coinPairPrice: RoundLockReadable): Promise<void>;
export declare function getDefaultEncodedMessage(version: number | bigint, coinPair: string, price: number | bigint, votedOracle: Address, blockNumber: number | bigint): Promise<{
    msg: {
        version: bigint;
        coinPair: string;
        price: bigint;
        votedOracle: `0x${string}`;
        blockNumber: bigint;
    };
    encMsg: `0x${string}`;
}>;
export type OracleConsensusSignatures = {
    publisher: OracleDefinition;
    sortedOracles: OracleDefinition[];
    sigV: number[];
    sigR: Hex[];
    sigS: Hex[];
};
export declare function getOracleConsensusSignatures(oracles: OracleDefinition[], rawMessage: Hex, publisher?: OracleDefinition): Promise<OracleConsensusSignatures>;
export declare function publishPrice(coinPairPrice: ContractOf<'CoinPairPrice'>, coinPairName: string, price: bigint, oracles: OracleDefinition[], publisher?: OracleDefinition): Promise<void>;
export declare function runTasks(tasksRunner: ContractOf<'TasksRunner'>, oracles: OracleDefinition[], publisher?: OracleDefinition): Promise<void>;
export declare function initCoinpair(deployer: Deployer, name: string, governor: Awaited<ReturnType<typeof createGovernor>>, token: ContractOf<'GovernedERC20'>, oracleMgr: ContractOf<'OracleManager'>, registry: ContractOf<'GovernedRegistry'>, whitelist: Address[], maxOraclesPerRound?: bigint, maxSubscribedOraclesPerRound?: bigint, roundLockPeriod?: bigint, maxMissedSigRounds?: bigint, validPricePeriodInBlocks?: bigint, emergencyPublishingPeriodInBlocks?: bigint, bootstrapPrice?: bigint): Promise<ContractOf<'CoinPairPrice'>>;
export declare function initContracts(deployer: Deployer, governorOwner: WalletClient, period?: bigint, minSubscriptionStake?: bigint, oracleManagerWhitelisted?: Address[], withdrawLockTime?: bigint, governor?: Awaited<ReturnType<typeof createGovernor>> | null, wList?: Address[]): Promise<{
    governor: Awaited<ReturnType<typeof createGovernor>>;
    token: ContractOf<'GovernedERC20'>;
    oracleMgr: ContractOf<'OracleManager'>;
    supporters: ContractOf<'Supporters'>;
    delayMachine: ContractOf<'DelayMachine'>;
    staking: ContractOf<'Staking'>;
    stakingMock: ContractOf<'StakingMock'>;
    votingMachine: ContractOf<'MockVotingMachine'>;
    registry: ContractOf<'GovernedRegistry'>;
}>;
export declare function initContractsWithCoinPairs(deployer: Deployer, governorOwner: WalletClient, period?: bigint, minSubscriptionStake?: bigint, whitelist?: Address[]): Promise<Awaited<ReturnType<typeof initContracts>> & {
    coinPairPriceBTCUSD: ContractOf<'CoinPairPrice'>;
    coinPairPriceRIFBTC: ContractOf<'CoinPairPrice'>;
}>;
export {};
//# sourceMappingURL=helpers.d.ts.map