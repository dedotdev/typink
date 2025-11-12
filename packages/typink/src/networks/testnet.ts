import { JsonRpcApi, NetworkInfo, NetworkType } from '../types.js';
import { CHAIN_ASSETS_BASE_URL } from './constants.js';

export const popTestnet: NetworkInfo = {
  id: 'pop_testnet',
  type: NetworkType.TESTNET,
  name: 'POP Testnet',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/pop-network.svg',
  providers: ['wss://rpc1.paseo.popnetwork.xyz'],
  symbol: 'PAS',
  decimals: 10,
  faucetUrl: 'https://onboard.popnetwork.xyz',
  pjsUrl: 'https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frpc1.paseo.popnetwork.xyz',
};

export const alephZeroTestnet: NetworkInfo = {
  id: 'alephzero_testnet',
  type: NetworkType.TESTNET,
  name: 'Aleph Zero Testnet',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/alephzero.svg',
  providers: ['wss://ws.test.azero.dev'],
  symbol: 'TZERO',
  decimals: 12,
  faucetUrl: 'https://faucet.test.azero.dev',
  jsonRpcApi: JsonRpcApi.LEGACY,
  subscanUrl: 'https://alephzero-testnet.subscan.io',
};

export const shibuyaTestnet: NetworkInfo = {
  id: 'astar_shibuya',
  type: NetworkType.TESTNET,
  name: 'Shibuya',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/shiden.png',
  providers: ['wss://rpc.shibuya.astar.network'],
  symbol: 'SBY',
  decimals: 18,
  faucetUrl: 'https://docs.astar.network/docs/build/environment/faucet',
  subscanUrl: 'https://shibuya.subscan.io',
};

export const westend: NetworkInfo = {
  id: 'westend',
  type: NetworkType.TESTNET,
  name: 'Westend',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/westend.png`,
  providers: ['wss://westend-rpc.polkadot.io'],
  symbol: 'WND',
  decimals: 12,
  faucetUrl: 'https://faucet.polkadot.io',
  subscanUrl: 'https://westend.subscan.io',
  chainSpec: async () => {
    return (await import('@dedot/chain-specs/westend2')).chainSpec;
  },
};

export const westendAssetHub: NetworkInfo = {
  id: 'westend_asset_hub',
  type: NetworkType.TESTNET,
  name: 'Westend Asset Hub',
  logo: 'https://assethub-westend.subscan.io/_next/image?url=%2Fchains%2Fassethub-westend%2Flogo-mini.png&w=256&q=75',
  providers: ['wss://westend-asset-hub-rpc.polkadot.io'],
  symbol: 'WND',
  decimals: 12,
  faucetUrl: 'https://faucet.polkadot.io',
  subscanUrl: 'https://assethub-westend.subscan.io',
  chainSpec: async () => {
    return (await import('@dedot/chain-specs/westend2_asset_hub')).chainSpec;
  },
  relayChain: westend,
};

export const westendPeople: NetworkInfo = {
  id: 'westend_people',
  type: NetworkType.TESTNET,
  name: 'Westend People',
  logo: 'https://people-westend.subscan.io/_next/image?url=%2Fchains%2Fpeople-westend%2Flogo-mini.png&w=256&q=75',
  providers: ['wss://westend-people-rpc.polkadot.io'],
  symbol: 'WND',
  decimals: 12,
  faucetUrl: 'https://faucet.polkadot.io',
  subscanUrl: 'https://people-westend.subscan.io',
  chainSpec: async () => {
    return (await import('@dedot/chain-specs/westend2_people')).chainSpec;
  },
  relayChain: westend,
};

export const paseo: NetworkInfo = {
  id: 'paseo',
  type: NetworkType.TESTNET,
  name: 'Paseo',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/paseotest.png`,
  providers: [
    'wss://paseo.rpc.amforc.com',
    'wss://paseo-rpc.dwellir.com',
    'wss://rpc.ibp.network/paseo',
    'wss://rpc.dotters.network/paseo',
  ],
  symbol: 'PAS',
  decimals: 10,
  faucetUrl: 'https://faucet.polkadot.io',
  subscanUrl: 'https://paseo.subscan.io',
  chainSpec: async () => {
    return (await import('@dedot/chain-specs/paseo')).chainSpec;
  },
};

export const paseoPeople: NetworkInfo = {
  id: 'paseo_people',
  type: NetworkType.TESTNET,
  name: 'Paseo People',
  logo: 'https://people-paseo.subscan.io/_next/image?url=%2Fchains%2Fpeople-paseo%2Flogo-mini.png&w=256&q=75',
  providers: [
    'wss://sys.ibp.network/people-paseo', // --
    'wss://people-paseo.dotters.network',
  ],
  symbol: 'PAS',
  decimals: 10,
  faucetUrl: 'https://faucet.polkadot.io',
  subscanUrl: 'https://people-paseo.subscan.io',
  chainSpec: async () => {
    return (await import('@dedot/chain-specs/paseo_people')).chainSpec;
  },
  relayChain: paseo,
};

export const paseoAssetHub: NetworkInfo = {
  id: 'paseo_asset_hub',
  type: NetworkType.TESTNET,
  name: 'Paseo Asset Hub',
  logo: 'https://assethub-paseo.subscan.io/_next/image?url=%2Fchains%2Fassethub-paseo%2Flogo-mini.png&w=256&q=75',
  providers: [
    'wss://asset-hub-paseo-rpc.dwellir.com',
    'wss://sys.ibp.network/asset-hub-paseo',
    'wss://asset-hub-paseo.dotters.network',
    'wss://pas-rpc.stakeworld.io/assethub',
    'wss://sys.turboflakes.io/asset-hub-paseo',
  ],
  symbol: 'PAS',
  decimals: 10,
  faucetUrl: 'https://faucet.polkadot.io',
  subscanUrl: 'https://assethub-paseo.subscan.io',
  chainSpec: async () => {
    return (await import('@dedot/chain-specs/paseo_asset_hub')).chainSpec;
  },
  relayChain: paseo,
};

export const passetHub: NetworkInfo = {
  id: 'passet_hub',
  type: NetworkType.TESTNET,
  name: 'Passet Hub',
  logo: 'https://assethub-paseo.subscan.io/_next/image?url=%2Fchains%2Fassethub-paseo%2Flogo-mini.png&w=256&q=75',
  providers: [
    'wss://passet-hub-paseo.ibp.network', // --
    'wss://testnet-passet-hub.polkadot.io',
  ],
  symbol: 'PAS',
  decimals: 10,
  faucetUrl: 'https://faucet.polkadot.io/?parachain=1111',
};

export const paseoHydration: NetworkInfo = {
  id: 'paseo_hydration',
  type: NetworkType.TESTNET,
  name: 'Paseo Hydration',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/hydrationpaseo.png`,
  providers: ['wss://paseo-rpc.play.hydration.cloud'],
  symbol: 'HDX',
  decimals: 12,
  faucetUrl: 'https://faucet.polkadot.io',
};
