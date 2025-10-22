import { NetworkInfo } from '../types.js';

/**
 * Convert a genesis hash to a WalletConnect chain identifier
 * @param genesisHash - The genesis hash of the network
 * @returns WalletConnect chain identifier in format "polkadot:{genesisHash}"
 */
export function genesisHashToCaipId(genesisHash: string): string {
  return `polkadot:${genesisHash.replace('0x', '').slice(0, 32)}`;
}

/**
 * Convert an array of NetworkInfo to WalletConnect chain identifiers
 * @param networks - Array of network info from typink
 * @returns Array of WalletConnect chain identifiers
 */
export function convertNetworkInfoToCaipId(networks: NetworkInfo[]): string[] {
  return networks.filter((o) => !!o.genesisHash).map((o) => genesisHashToCaipId(o.genesisHash!));
}
