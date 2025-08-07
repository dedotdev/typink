import { ReactNode } from 'react';
import { LooseContractMetadata } from 'dedot/contracts';
import { KeypairType } from './pjs-types.js';

export * from './pjs-types.js';

export type Pop<T extends any[]> = T extends [...infer U, any?] ? U : never;
export type Args<T> = T extends [] ? { args?: [] | undefined } : { args: T };
export type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

export interface Props {
  className?: string;
  children?: ReactNode;

  [prop: string]: any;
}

export type SubstrateAddress = string;

/**
 * Unified account interface for both extension wallets and hardware wallets
 */
export interface TypinkAccount {
  // Core fields (required)
  address: string;
  walletId: string; // e.g., 'ledger', 'subwallet-js', 'talisman'
  source: 'extension' | 'hardware';
  
  // Common optional fields
  name?: string;
  
  // Extension-specific fields (optional)
  genesisHash?: string | null;
  type?: KeypairType; // 'ed25519' | 'sr25519' | 'ecdsa' | 'ethereum'
  
  // Hardware-specific fields (optional)
  pubkey?: string;
  index?: number;
}

export interface ContractDeployment {
  id: string;
  metadata: LooseContractMetadata | string;
  address: SubstrateAddress;
  network: string;
}

export enum JsonRpcApi {
  LEGACY = 'legacy',
  NEW = 'new',
}

export type NetworkId = string;

export interface NetworkInfo {
  id: NetworkId;
  name: string;
  logo: string;
  providers: string[];
  symbol: string;
  decimals: number;
  subscanUrl?: string;
  pjsUrl?: string;
  faucetUrl?: string;
  jsonRpcApi?: JsonRpcApi; // default to new
}
