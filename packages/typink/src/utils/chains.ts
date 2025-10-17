import { NetworkInfo } from '../types.js';

/**
 * Known chain genesis hashes for WalletConnect
 * Format: "polkadot:{genesisHash}"
 */
const CHAIN_GENESIS_HASHES: Record<string, string> = {
  // Mainnet chains
  polkadot: '91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
  polkadot_asset_hub: '68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f',
  kusama: 'b0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
  kusama_asset_hub: '48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
  alephzero: '70255b4d28de0fc4e1a193d7e175ad1ccef431598211c55538f1018651a0307e',
  astar: '9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6',
  shiden: 'f1cf9022c7ebb34b162d5b5e34e705a5a740b2d0ecc1009fb89023e62a488108',
  hydration: 'afdc188f45c71dacbaa0b62e16a91f726c7b8699a9748cdf715459de6b7f366d',
  basilisk: 'a85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755',

  // Testnet chains
  westend: 'e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
  westend_asset_hub: '67f9723393ef76214df0118c34bbbd3dbebc8ed46a10973a8c969d48fe7598c9',
  // pop_testnet: Use westend for now since POP is a parachain on Paseo/Westend
  pop_testnet: 'e143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
  alephzero_testnet: '05d5279c52c484cc80396535a316add7d47b1c5b9e0398dd1f584149341460c5',
};

/**
 * Convert a NetworkInfo to a WalletConnect chain identifier
 * @param network - The network info from typink
 * @returns WalletConnect chain identifier in format "polkadot:{genesisHash}" or undefined if not found
 */
export function networkInfoToWalletConnectChain(network: NetworkInfo): string | undefined {
  const genesisHash = CHAIN_GENESIS_HASHES[network.id];

  if (!genesisHash) {
    console.warn(`No genesis hash mapping found for network: ${network.id}`);
    return undefined;
  }

  return genesisHashToWalletConnectChain(genesisHash);
}

/**
 * Convert a genesis hash to a WalletConnect chain identifier
 * @param genesisHash - The genesis hash of the network
 * @returns WalletConnect chain identifier in format "polkadot:{genesisHash}"
 */
export function genesisHashToWalletConnectChain(genesisHash: string): string {
  return `polkadot:${genesisHash.replace('0x', '').slice(0, 32)}`;
}

/**
 * Convert an array of NetworkInfo to WalletConnect chain identifiers
 * @param networks - Array of network info from typink
 * @returns Array of WalletConnect chain identifiers
 */
export function getWalletConnectChains(networks: NetworkInfo[]): string[] {
  return networks.map(networkInfoToWalletConnectChain).filter((chain): chain is string => chain !== undefined);
}
