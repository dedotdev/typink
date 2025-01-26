import { ReactNode } from 'react';
import { ContractMetadata } from 'dedot/contracts';

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
  providers: string[];
  symbol: string;
  decimals: number;
  subscanUrl?: string;
  pjsUrl?: string;
  faucetUrl?: string;
  jsonRpcApi?: JsonRpcApi; // default to new
}
