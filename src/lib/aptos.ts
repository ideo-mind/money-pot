import { 
  Aptos, 
  AptosConfig, 
  Network, 
  Account, 
  Ed25519PrivateKey,
  AccountAddress,
  SimpleTransaction,
  InputSubmitTransactionData,
  EntryFunction,
  TransactionPayload,
  U64,
  Bool,
  MoveValue,
  MoveVector,
  MoveStruct,
  MoveStructId,
  TypeTag,
  StructTag,
  U8,
  U16,
  U32,
  U128,
  U256,
  Serializer,
  Deserializer,
  Hex,
  HexInput
} from "@aptos-labs/ts-sdk";

// Environment configuration
const APTOS_NODE_URL = import.meta.env.VITE_APTOS_NODE_URL || "https://fullnode.testnet.aptoslabs.com/v1";
const MONEY_POT_CONTRACT_ADDRESS = import.meta.env.VITE_MONEY_POT_CONTRACT_ADDRESS || "0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f";

export const MODULE_ADDRESS = MONEY_POT_CONTRACT_ADDRESS;
export const MODULE_NAME = "money_pot_manager";
export const MODULE_QUALIFIED_NAME = `${MODULE_ADDRESS}::${MODULE_NAME}`;

// Create Aptos config with custom node URL
const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: APTOS_NODE_URL
});

export const aptos = new Aptos(aptosConfig);

// Export environment variables for use in other parts of the app
export const ENV_CONFIG = {
  APTOS_NODE_URL,
  MONEY_POT_CONTRACT_ADDRESS,
  MONEY_AUTH_URL: import.meta.env.VITE_MONEY_AUTH_URL || "https://auth.money-pot.unreal.art",
  VERIFIER_SERVICE_BASE_URL: import.meta.env.VITE_VERIFIER_SERVICE_BASE_URL || "",
  USDC_TOKEN_ADDRESS: import.meta.env.VITE_USDC_TOKEN_ADDRESS || "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17da",
  NODE_ENV: import.meta.env.MODE || "development"
};

// Account management functions
export const loadAccountFromPrivateKey = (privateKeyHex: string): Account => {
  const privateKey = new Ed25519PrivateKey(Hex.fromHexString(privateKeyHex).toUint8Array());
  return Account.fromPrivateKey({ privateKey });
};

// Transaction helper functions
export const createAccount = async (creator: Account, newAccount: Account): Promise<string> => {
  const transaction = await aptos.transaction.build.simple({
    sender: creator.accountAddress,
    data: {
      function: "0x1::aptos_account::create_account",
      typeArguments: [],
      functionArguments: [newAccount.accountAddress],
    },
  });

  const committedTransaction = await aptos.signAndSubmitTransaction({
    signer: creator,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: committedTransaction.hash });
  return committedTransaction.hash;
};

export const fundAccount = async (sender: Account, receiver: AccountAddress, amount: number): Promise<string> => {
  const transaction = await aptos.transaction.build.simple({
    sender: sender.accountAddress,
    data: {
      function: "0x1::aptos_account::transfer",
      typeArguments: [],
      functionArguments: [receiver, amount],
    },
  });

  const committedTransaction = await aptos.signAndSubmitTransaction({
    signer: sender,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: committedTransaction.hash });
  return committedTransaction.hash;
};

export const fundFungibleAsset = async (
  sender: Account, 
  receiver: AccountAddress, 
  tokenAddress: string, 
  amount: number
): Promise<string> => {
  // For now, use a simplified approach without complex type arguments
  // This can be enhanced later when the exact fungible asset structure is known
  const transaction = await aptos.transaction.build.simple({
    sender: sender.accountAddress,
    data: {
      function: "0x1::aptos_account::transfer",
      typeArguments: [],
      functionArguments: [receiver, amount],
    },
  });

  const committedTransaction = await aptos.signAndSubmitTransaction({
    signer: sender,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: committedTransaction.hash });
  return committedTransaction.hash;
};

// Money Pot specific functions
export const createPot = async (
  creator: Account,
  amount: number,
  durationSeconds: number,
  fee: number,
  oneFaAddress: AccountAddress
): Promise<string> => {
  const transaction = await aptos.transaction.build.simple({
    sender: creator.accountAddress,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_pot_entry`,
      typeArguments: [],
      functionArguments: [amount, durationSeconds, fee, oneFaAddress],
    },
  });

  const committedTransaction = await aptos.signAndSubmitTransaction({
    signer: creator,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: committedTransaction.hash });
  return committedTransaction.hash;
};

export const attemptPot = async (hunter: Account, potId: number): Promise<string> => {
  const transaction = await aptos.transaction.build.simple({
    sender: hunter.accountAddress,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::attempt_pot_entry`,
      typeArguments: [],
      functionArguments: [potId],
    },
  });

  const committedTransaction = await aptos.signAndSubmitTransaction({
    signer: hunter,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: committedTransaction.hash });
  return committedTransaction.hash;
};

export const attemptCompleted = async (
  oracle: Account,
  attemptId: number,
  status: boolean
): Promise<string> => {
  const transaction = await aptos.transaction.build.simple({
    sender: oracle.accountAddress,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::attempt_completed`,
      typeArguments: [],
      functionArguments: [attemptId, status],
    },
  });

  const committedTransaction = await aptos.signAndSubmitTransaction({
    signer: oracle,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: committedTransaction.hash });
  return committedTransaction.hash;
};

// View functions
export const getActivePots = async (): Promise<number[]> => {
  const response = await aptos.view({
    payload: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_active_pots`,
      typeArguments: [],
      functionArguments: [],
    },
  });
  return response.map((item: any) => Number(item));
};

export const getPots = async (): Promise<number[]> => {
  const response = await aptos.view({
    payload: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_pots`,
      typeArguments: [],
      functionArguments: [],
    },
  });
  return response.map((item: any) => Number(item));
};

export const getAttempt = async (attemptId: number): Promise<any> => {
  const response = await aptos.view({
    payload: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_attempt`,
      typeArguments: [],
      functionArguments: [attemptId],
    },
  });
  return response;
};

// Event processing functions
export const getTransactionEvents = async (txHash: string): Promise<any[]> => {
  const transaction = await aptos.getTransactionByHash({ transactionHash: txHash });
  return (transaction as any).events || [];
};

export const extractPotIdFromEvents = (events: any[]): number | null => {
  for (const event of events) {
    if (event.type === `${MODULE_ADDRESS}::${MODULE_NAME}::PotEvent`) {
      const data = event.data;
      const eventTypeHex = data.event_type;
      if (eventTypeHex) {
        try {
          const eventType = Buffer.from(eventTypeHex.slice(2), 'hex').toString();
          if (eventType === "created") {
            return Number(data.id);
          }
        } catch {
          continue;
        }
      }
    }
  }
  return null;
};

export const extractAttemptIdFromEvents = (events: any[]): number | null => {
  for (const event of events) {
    if (event.type === `${MODULE_ADDRESS}::${MODULE_NAME}::PotEvent`) {
      const data = event.data;
      const eventTypeHex = data.event_type;
      if (eventTypeHex) {
        try {
          const eventType = Buffer.from(eventTypeHex.slice(2), 'hex').toString();
          if (eventType === "attempted") {
            return Number(data.id);
          }
        } catch {
          continue;
        }
      }
    }
  }
  return null;
};