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
};
