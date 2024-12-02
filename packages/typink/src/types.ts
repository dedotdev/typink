import { ReactNode } from 'react';
import { ContractMetadata } from 'dedot/contracts';
import type { Signer as InjectedSigner } from '@polkadot/types/types';

export type Pop<T extends any[]> = T extends [...infer U, any?] ? U : never;
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

export type NetworkId = string;

export interface NetworkInfo {
  id: NetworkId;
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

type This = typeof globalThis;
export type Unsubcall = () => void;

export interface InjectedAccounts {
  get: (anyType?: boolean) => Promise<InjectedAccount[]>;
  subscribe: (cb: (accounts: InjectedAccount[]) => void | Promise<void>) => Unsubcall;
}

export interface InjectedExtensionInfo {
  name: string;
  version: string;
}

export interface Injected {
  accounts: InjectedAccounts;
  signer: InjectedSigner;
}

export interface InjectedWindowProvider {
  connect?: (origin: string) => Promise<InjectedExtension>;
  enable?: (origin: string) => Promise<Injected>;
  version?: string;
}

export interface InjectedWindow extends This {
  injectedWeb3: Record<string, InjectedWindowProvider>;
}

export type InjectedExtension = InjectedExtensionInfo & Injected;
