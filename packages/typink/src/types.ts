import { ReactNode } from 'react';
import { ContractMetadata } from 'dedot/contracts';

export type Pop<T extends any[]> = T extends [...infer U, any] ? U : never;
export type Args<T> = T extends [] ? { args?: [] | undefined } : { args: T };
export type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

export interface Props {
  className?: string;
  children?: ReactNode;

  [prop: string]: any;
}

export type SubstrateAddress = string;

export interface ContractDeployment {
  id: string;
  metadata: ContractMetadata | string;
  address: SubstrateAddress;
  network: string;
}

export enum JsonRpcApi {
  LEGACY = 'legacy',
  NEW = 'new',
}

export interface NetworkInfo {
  id: string;
  name: string;
  logo: string;
  provider: string;
  prefix: number;
  symbol: string;
  decimals: number;
  subscanUrl?: string;
  faucetUrl?: string;
  jsonRpcApi?: JsonRpcApi; // default to new
}

export type KeypairType = 'ed25519' | 'sr25519' | 'ecdsa' | 'ethereum';

export interface InjectedAccount {
  address: SubstrateAddress;
  genesisHash?: string | null;
  name?: string;
  type?: KeypairType;
}
