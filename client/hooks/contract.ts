"use client";

import {
  Contract,
  Networks,
  TransactionBuilder,
  Keypair,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
  rpc,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
  isAllowed,
  requestAccess,
} from "@stellar/freighter-api";

// ============================================================
// CONSTANTS — Update these for your contract
// ============================================================

/** Your deployed Soroban contract ID */
export const CONTRACT_ADDRESS =
  "CCZYBHDQMYUV5WAMJODBDVH7OEH2W7JQDEYGX6RZRICVGA26LORKSHBJ";

/** Network passphrase (testnet by default) */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Soroban RPC URL */
export const RPC_URL = "https://soroban-testnet.stellar.org";

/** Horizon URL */
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

/** Network name for Freighter */
export const NETWORK = "TESTNET";

// ============================================================
// RPC Server Instance
// ============================================================

const server = new rpc.Server(RPC_URL);

// ============================================================
// Wallet Helpers
// ============================================================

export async function checkConnection(): Promise<boolean> {
  const result = await isConnected();
  return result.isConnected;
}

export async function connectWallet(): Promise<string> {
  const connResult = await isConnected();
  if (!connResult.isConnected) {
    throw new Error("Freighter extension is not installed or not available.");
  }

  const allowedResult = await isAllowed();
  if (!allowedResult.isAllowed) {
    await setAllowed();
    await requestAccess();
  }

  const { address } = await getAddress();
  if (!address) {
    throw new Error("Could not retrieve wallet address from Freighter.");
  }
  return address;
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const connResult = await isConnected();
    if (!connResult.isConnected) return null;

    const allowedResult = await isAllowed();
    if (!allowedResult.isAllowed) return null;

    const { address } = await getAddress();
    return address || null;
  } catch {
    return null;
  }
}

// ============================================================
// Contract Interaction Helpers
// ============================================================

/**
 * Build, simulate, and optionally sign + submit a Soroban contract call.
 */
export async function callContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller: string,
  sign: boolean = true
) {
  const contract = new Contract(CONTRACT_ADDRESS);
  const account = await server.getAccount(caller);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...params))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulated)) {
    throw new Error(
      `Simulation failed: ${(simulated as rpc.Api.SimulateTransactionErrorResponse).error}`
    );
  }

  if (!sign) {
    return simulated;
  }

  const prepared = rpc.assembleTransaction(tx, simulated).build();

  const { signedTxXdr } = await signTransaction(prepared.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const txToSubmit = TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const result = await server.sendTransaction(txToSubmit);

  if (result.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${result.status}`);
  }

  let getResult = await server.getTransaction(result.hash);
  while (getResult.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    getResult = await server.getTransaction(result.hash);
  }

  if (getResult.status === "FAILED") {
    throw new Error("Transaction failed on chain.");
  }

  return getResult;
}

/**
 * Read-only contract call (does not require signing).
 */
export async function readContract(
  method: string,
  params: xdr.ScVal[] = [],
  caller?: string
) {
  const account =
    caller || Keypair.random().publicKey();
  const sim = await callContract(method, params, account, false);
  if (
    rpc.Api.isSimulationSuccess(sim as rpc.Api.SimulateTransactionResponse) &&
    (sim as rpc.Api.SimulateTransactionSuccessResponse).result
  ) {
    return scValToNative(
      (sim as rpc.Api.SimulateTransactionSuccessResponse).result!.retval
    );
  }
  return null;
}

// ============================================================
// ScVal Conversion Helpers
// ============================================================

export function toScValString(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "string" });
}

export function toScValU32(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

export function toScValU64(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "u64" });
}

export function toScValI128(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

export function toScValAddress(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

export function toScValBool(value: boolean): xdr.ScVal {
  return nativeToScVal(value, { type: "bool" });
}

// ============================================================
// NFT Gallery — Contract Methods
// ============================================================

export interface NFTData {
  id: number;
  name: string;
  description: string;
  image_url: string;
  creator: string;
  created_at: number;
}

/**
 * Mint a new NFT. Anyone can mint - completely permissionless.
 * Calls: mint(minter: Address, name: String, description: String, image_url: String) -> u64
 */
export async function mintNFT(
  caller: string,
  name: string,
  description: string,
  imageUrl: string
) {
  return callContract(
    "mint",
    [
      toScValAddress(caller),
      toScValString(name),
      toScValString(description),
      toScValString(imageUrl),
    ],
    caller,
    true
  );
}

/**
 * Transfer NFT to another address. Only the owner can transfer.
 * Calls: transfer(from: Address, to: Address, nft_id: u64)
 */
export async function transferNFT(
  caller: string,
  to: string,
  nftId: number
) {
  return callContract(
    "transfer",
    [toScValAddress(caller), toScValAddress(to), toScValU64(BigInt(nftId))],
    caller,
    true
  );
}

/**
 * Get NFT data by ID (read-only).
 * Calls: get_nft(nft_id: u64) -> NFTData
 */
export async function getNFT(nftId: number, caller?: string) {
  const result = await readContract(
    "get_nft",
    [toScValU64(BigInt(nftId))],
    caller
  );
  if (result && typeof result === "object") {
    return {
      id: Number((result as any).id),
      name: String((result as any).name),
      description: String((result as any).description),
      image_url: String((result as any).image_url),
      creator: String((result as any).creator),
      created_at: Number((result as any).created_at),
    };
  }
  return null;
}

/**
 * Get owner of an NFT (read-only).
 * Calls: get_owner(nft_id: u64) -> Address
 */
export async function getNFTOwner(nftId: number, caller?: string) {
  return readContract(
    "get_owner",
    [toScValU64(BigInt(nftId))],
    caller
  );
}

/**
 * Get all NFTs in the gallery (read-only).
 * Calls: get_all_nfts() -> Vec<NFTData>
 */
export async function getAllNFTs(caller?: string) {
  const result = await readContract("get_all_nfts", [], caller);
  if (Array.isArray(result)) {
    return result.map((nft: any) => ({
      id: Number(nft.id),
      name: String(nft.name),
      description: String(nft.description),
      image_url: String(nft.image_url),
      creator: String(nft.creator),
      created_at: Number(nft.created_at),
    }));
  }
  return [];
}

/**
 * Get all NFTs owned by a specific address (read-only).
 * Calls: get_owner_nfts(owner: Address) -> Vec<u64>
 */
export async function getOwnerNFTs(owner: string, caller?: string) {
  const result = await readContract(
    "get_owner_nfts",
    [toScValAddress(owner)],
    caller
  );
  if (Array.isArray(result)) {
    return result.map((id: any) => Number(id));
  }
  return [];
}

/**
 * Get NFTs with pagination (read-only).
 * Calls: get_nfts_paginated(offset: u32, limit: u32) -> Vec<NFTData>
 */
export async function getNFTsPaginated(
  offset: number,
  limit: number,
  caller?: string
) {
  const result = await readContract(
    "get_nfts_paginated",
    [toScValU32(offset), toScValU32(limit)],
    caller
  );
  if (Array.isArray(result)) {
    return result.map((nft: any) => ({
      id: Number(nft.id),
      name: String(nft.name),
      description: String(nft.description),
      image_url: String(nft.image_url),
      creator: String(nft.creator),
      created_at: Number(nft.created_at),
    }));
  }
  return [];
}

/**
 * Update NFT metadata. Only the owner can update.
 * Calls: set_metadata(owner: Address, nft_id: u64, name: String, description: String, image_url: String)
 */
export async function setNFTMetadata(
  caller: string,
  nftId: number,
  name: string,
  description: string,
  imageUrl: string
) {
  return callContract(
    "set_metadata",
    [
      toScValAddress(caller),
      toScValU64(BigInt(nftId)),
      toScValString(name),
      toScValString(description),
      toScValString(imageUrl),
    ],
    caller,
    true
  );
}

export { nativeToScVal, scValToNative, Address, xdr };
