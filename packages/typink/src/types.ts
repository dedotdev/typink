import { ReactNode } from 'react';
import { LooseContractMetadata } from 'dedot/contracts';

export * from './pjs-types.js';

export interface TypinkAccount {
  source: string; // wallet id that the account is from
  address: string;
  name?: string;
}

export type Pop<T extends any[]> = T extends [...infer U, any?] ? U : never;
export type Args<T> = T extends [] ? { args?: [] | undefined } : { args: T };
export type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

export interface Props {
  className?: string;
  children?: ReactNode;

  [prop: string]: any;
}

export type SubstrateAddress = string;

export type LooseSolAbi = Array<{ type: string; [prop: string]: any }>; // replace with type from dedot

export interface ContractDeployment {
  id: string;
  metadata: LooseContractMetadata | LooseSolAbi | string;
  address: SubstrateAddress;
  network: string;
}

export enum JsonRpcApi {
  LEGACY = 'legacy',
  NEW = 'new',
}

export enum NetworkType {
  DEVNET = 'devnet',
  TESTNET = 'testnet',
  MAINNET = 'mainnet',
}

export type NetworkId = string;

export type ProviderType = 'light-client' | 'random-rpc' | `wss://${string}` | `ws://${string}`;

export function validateProvider(provider: string | undefined): ProviderType {
  if (!provider) {
    return 'random-rpc'; // Default for undefined
  }

  if (provider === 'light-client' || provider === 'random-rpc') {
    return provider;
  }

  if (provider.startsWith('wss://') || provider.startsWith('ws://')) {
    return provider as `wss://${string}` | `ws://${string}`;
  }

  // Invalid provider - fallback to random
  console.warn(`Invalid provider "${provider}", falling back to random-rpc`);
  return 'random-rpc';
}

export interface NetworkConnection {
  networkId: NetworkId;
  provider?: ProviderType;
}

export interface NetworkInfo {
  id: NetworkId;
  type?: NetworkType; // default to mainnet
  name: string;
  logo: string;
  providers: string[];
  symbol: string;
  decimals: number;
  subscanUrl?: string;
  pjsUrl?: string;
  faucetUrl?: string;
  jsonRpcApi?: JsonRpcApi; // default to new
  chainSpec?: () => Promise<string>;
  relayChain?: NetworkInfo;
}

export enum ClientConnectionStatus {
  NotConnected = 'NotConnected', // not yet connected or disconnected
  Connecting = 'Connecting', // initial connecting or reconnecting
  Connected = 'Connected',
  Error = 'Error',
}

export interface NetworkOptions {
  networkId?: NetworkId;
}
