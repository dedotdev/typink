import { CHAIN_ASSETS_BASE_URL } from './constants.js';
import { JsonRpcApi, NetworkInfo, NetworkType } from '../types.js';

export const alephZero: NetworkInfo = {
  id: 'alephzero',
  type: NetworkType.MAINNET,
  name: 'Aleph Zero',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/alephzero.svg',
  providers: ['wss://ws.azero.dev'],
  symbol: 'AZERO',
  decimals: 12,
  jsonRpcApi: JsonRpcApi.LEGACY,
  subscanUrl: 'https://alephzero.subscan.io',
  genesisHash: '0x70255b4d28de0fc4e1a193d7e175ad1ccef431598211c55538f1018651a0307e',
};

export const astar: NetworkInfo = {
  id: 'astar',
  type: NetworkType.MAINNET,
  name: 'Astar',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/astar.png',
  providers: ['wss://rpc.astar.network'],
  symbol: 'ASTR',
  decimals: 18,
  subscanUrl: 'https://astar.subscan.io',
  genesisHash: '0x9eb76c5184c4ab8679d2d5d819fdf90b9c001403e9e17da2e14b6d8aec4029c6',
};

export const shiden: NetworkInfo = {
  id: 'astar_shiden',
  type: NetworkType.MAINNET,
  name: 'Shiden',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/shiden.png',
  providers: ['wss://rpc.shiden.astar.network'],
  symbol: 'SDN',
  decimals: 18,
  subscanUrl: 'https://shiden.subscan.io',
  genesisHash: '0xf1cf9022c7ebb34b162d5b5e34e705a5a740b2d0ecc1009fb89023e62a488108',
};

export const polkadot: NetworkInfo = {
  id: 'polkadot',
  type: NetworkType.MAINNET,
  name: 'Polkadot',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/polkadot.png`,
  providers: [
    'wss://polkadot-rpc.dwellir.com',
    'wss://dot-rpc.stakeworld.io',
    'wss://rpc-polkadot.luckyfriday.io',
    'wss://polkadot-rpc-tn.dwellir.com',
    'wss://rpc.ibp.network/polkadot',
    'wss://polkadot-public-rpc.blockops.network/ws',
    'wss://rockx-dot.w3node.com/polka-public-dot/ws',
    'wss://polkadot-rpc.publicnode.com',
    'wss://polkadot.api.onfinality.io/public-ws',
    'wss://rpc-polkadot.helixstreet.io',
    'wss://polkadot.dotters.network',
    'wss://polkadot.rpc.permanence.io',
  ],
  symbol: 'DOT',
  decimals: 10,
  subscanUrl: 'https://polkadot.subscan.io',
  chainSpec: async () => {
    return (await import('@substrate/connect-known-chains/polkadot')).chainSpec;
  },
  genesisHash: '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3',
};

export const polkadotAssetHub: NetworkInfo = {
  id: 'polkadot_asset_hub',
  type: NetworkType.MAINNET,
  name: 'Polkadot Asset Hub',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/statemint.png`,
  providers: [
    'wss://statemint-rpc-tn.dwellir.com',
    'wss://sys.ibp.network/statemint',
    'wss://rpc-asset-hub-polkadot.luckyfriday.io',
    'wss://polkadot-asset-hub-rpc.polkadot.io',
    'wss://dot-rpc.stakeworld.io/assethub',
    'wss://polkadot-assethub-rpc.blockops.network/ws',
    'wss://asset-hub-polkadot-rpc.dwellir.com',
    'wss://sys.ibp.network/asset-hub-polkadot',
    'wss://asset-hub-polkadot.dotters.network',
  ],
  symbol: 'DOT',
  decimals: 10,
  subscanUrl: 'https://assethub-polkadot.subscan.io',
  chainSpec: async () => {
    return (await import('@substrate/connect-known-chains/polkadot_asset_hub')).chainSpec;
  },
  relayChain: polkadot,
  genesisHash: '0x68d56f15f85d3136970ec16946040bc1752654e906147f7e43e9d539d7c3de2f',
};

export const polkadotPeople: NetworkInfo = {
  id: 'polkadot_people',
  type: NetworkType.MAINNET,
  name: 'Polkadot People',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/polkadot_people.png`,
  providers: [
    'wss://polkadot-people-rpc.polkadot.io',
    'wss://rpc-people-polkadot.luckyfriday.io',
    'wss://sys.ibp.network/people-polkadot',
    'wss://sys.dotters.network/people-polkadot',
    'wss://people-polkadot.dotters.network',
  ],
  symbol: 'DOT',
  decimals: 10,
  subscanUrl: 'https://people-polkadot.subscan.io',
  chainSpec: async () => {
    return (await import('@substrate/connect-known-chains/polkadot_people')).chainSpec;
  },
  relayChain: polkadot,
  genesisHash: '0x67fa177a097bfa18f77ea95ab56e9bcdfeb0e5b8a40e46298bb93e16b6fc5008',
};

export const kusama: NetworkInfo = {
  id: 'kusama',
  type: NetworkType.MAINNET,
  name: 'Kusama',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/kusama.png`,
  providers: [
    'wss://kusama-rpc-tn.dwellir.com',
    'wss://rpc-kusama.luckyfriday.io',
    'wss://ksm-rpc.stakeworld.io',
    'wss://rpc.ibp.network/kusama',
    'wss://kusama-rpc.publicnode.com',
    'wss://rockx-ksm.w3node.com/polka-public-ksm/ws',
    'wss://rpc-kusama.helixstreet.io',
    'wss://kusama.dotters.network',
    'wss://kusama.api.onfinality.io/public-ws',
  ],
  symbol: 'KSM',
  decimals: 12,
  subscanUrl: 'https://kusama.subscan.io',
  chainSpec: async () => {
    return (await import('@substrate/connect-known-chains/ksmcc3')).chainSpec;
  },
  genesisHash: '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe',
};

export const kusamaAssetHub: NetworkInfo = {
  id: 'kusama_asset_hub',
  type: NetworkType.MAINNET,
  name: 'Kusama Asset Hub',
  logo: 'https://assethub-kusama.subscan.io/_next/image?url=%2Fchains%2Fassethub-kusama%2Flogo-mini.png&w=256&q=75',
  providers: [
    'wss://asset-hub-kusama-rpc.n.dwellir.com',
    'wss://statemine-rpc-tn.dwellir.com',
    'wss://sys.ibp.network/asset-hub-kusama',
    'wss://asset-hub-kusama.dotters.network',
    'wss://rpc-asset-hub-kusama.luckyfriday.io',
    'wss://assethub-kusama.api.onfinality.io/public-ws',
    'wss://kusama-asset-hub-rpc.polkadot.io',
    'wss://ksm-rpc.stakeworld.io/assethub',
  ],
  symbol: 'KSM',
  decimals: 12,
  subscanUrl: 'https://assethub-kusama.subscan.io',
  chainSpec: async () => {
    return (await import('@substrate/connect-known-chains/ksmcc3_asset_hub')).chainSpec;
  },
  relayChain: kusama,
  genesisHash: '0x48239ef607d7928874027a43a67689209727dfb3d3dc5e5b03a39bdc2eda771a',
};

export const kusamaPeople: NetworkInfo = {
  id: 'kusama_people',
  type: NetworkType.MAINNET,
  name: 'Kusama People',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/peoplekusama.png`,
  providers: [
    'wss://people-kusama-rpc.n.dwellir.com',
    'wss://rpc-people-kusama.helixstreet.io',
    'wss://sys.ibp.network/people-kusama',
    'wss://people-kusama.dotters.network',
    'wss://rpc-people-kusama.luckyfriday.io',
    'wss://people-kusama.api.onfinality.io/public-ws',
    'wss://kusama-people-rpc.polkadot.io',
    'wss://ksm-rpc.stakeworld.io/people',
  ],
  symbol: 'KSM',
  decimals: 12,
  subscanUrl: 'https://people-kusama.subscan.io',
  chainSpec: async () => {
    return (await import('@substrate/connect-known-chains/ksmcc3_people')).chainSpec;
  },
  relayChain: kusama,
  genesisHash: '0xc1af4cb4eb3918e5db15086c0cc5ec17fb334f728b7c65dd44bfe1e174ff8b3f',
};

export const hydration: NetworkInfo = {
  id: 'hydration',
  type: NetworkType.MAINNET,
  name: 'Hydration',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/hydradx_main.png`,
  providers: [
    'wss://rpc.hydradx.cloud',
    'wss://rpc.helikon.io/hydradx',
    'wss://hydration-rpc.n.dwellir.com',
    'wss://hydration.ibp.network',
    'wss://hydration.dotters.network',
  ],
  symbol: 'HDX',
  decimals: 12,
  subscanUrl: 'https://hydration.subscan.io',
  genesisHash: '0xafdc188f45c71dacbaa0b62e16a91f726c7b8699a9748cdf715459de6b7f366d',
};

export const basilisk: NetworkInfo = {
  id: 'basilisk',
  type: NetworkType.MAINNET,
  name: 'Basilisk',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/basilisk.png`,
  providers: ['wss://rpc.basilisk.cloud', 'wss://basilisk-rpc.n.dwellir.com'],
  symbol: 'BSX',
  decimals: 12,
  subscanUrl: 'https://basilisk.subscan.io',
  genesisHash: '0xa85cfb9b9fd4d622a5b28289a02347af987d8f73fa3108450e2b4a11c1ce5755',
};

export const vara: NetworkInfo = {
  id: 'vara',
  type: NetworkType.MAINNET,
  name: 'Vara Network',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/vara_network.png`,
  providers: ['wss://rpc.vara-network.io', 'wss://rpc.vara.network'],
  symbol: 'VARA',
  decimals: 12,
  subscanUrl: 'https://vara.subscan.io',
  genesisHash: '0xfe1b4c55fd4d668101126434206571a7838a8b6b93a6d1b95d607e78e6c53763',
};
