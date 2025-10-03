import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
export const MODULE_ADDRESS = "0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f";
export const MODULE_NAME = "money_pot_manager";
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
export const aptos = new Aptos(aptosConfig);