import { JsonRpcApi, NetworkInfo } from '../types.js';

export const popTestnet: NetworkInfo = {
  id: 'pop_testnet',
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
  name: 'Westend',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/westend.png`,
  providers: ['wss://westend-rpc.polkadot.io'],
  symbol: 'WND',
  decimals: 12,
  faucetUrl: 'https://faucet.polkadot.io',
  subscanUrl: 'https://westend.subscan.io',
};

export const westendAssetHub: NetworkInfo = {
  id: 'westend_asset_hub',
  name: 'Westend Asset Hub',
  logo: 'https://assethub-westend.subscan.io/_next/image?url=%2Fchains%2Fassethub-westend%2Flogo-mini.png&w=256&q=75',
  providers: ['wss://westend-asset-hub-rpc.polkadot.io'],
  symbol: 'WND',
  decimals: 12,
  faucetUrl: 'https://faucet.polkadot.io',
  subscanUrl: 'https://assethub-westend.subscan.io',
};

export const westendPeople: NetworkInfo = {
  id: 'westend_people',
  name: 'Westend People',
  logo: 'https://people-westend.subscan.io/_next/image?url=%2Fchains%2Fpeople-westend%2Flogo-mini.png&w=256&q=75',
  providers: ['wss://westend-people-rpc.polkadot.io'],
  symbol: 'WND',
  decimals: 12,
  faucetUrl: 'https://faucet.polkadot.io',
  subscanUrl: 'https://people-westend.subscan.io',
};

export const paseo: NetworkInfo = {
  id: 'paseo_testnet',
  name: 'Paseo Testnet',
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
};

export const paseoPeople: NetworkInfo = {
  id: 'paseo_people',
  name: 'Paseo People',
  logo: 'https://people-paseo.subscan.io/_next/image?url=%2Fchains%2Fpeople-paseo%2Flogo-mini.png&w=256&q=75',
  providers: [
    'wss://sys.ibp.network/people-paseo', // --
    'wss://people-paseo.dotters.network',
  ],
  symbol: 'PAS',
  decimals: 10,
  faucetUrl: 'https://faucet.polkadot.io',
};

export const paseoAssetHub: NetworkInfo = {
  id: 'paseo_assethub',
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
};

export const passetHub: NetworkInfo = {
  id: 'passet_hub',
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
  name: 'Paseo Hydration Testnet',
  logo: `${CHAIN_ASSETS_BASE_URL}/assets/chains/hydrationpaseo.png`,
  providers: ['wss://paseo-rpc.play.hydration.cloud'],
  symbol: 'HDX',
  decimals: 12,
  faucetUrl: 'https://faucet.polkadot.io',
};
