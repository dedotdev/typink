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

export const westendAssetHub: NetworkInfo = {
  id: 'westend_asset_hub',
  name: 'Westend AssetHub',
  logo: 'https://assethub-westend.subscan.io/_next/image?url=%2Fchains%2Fassethub-westend%2Flogo-mini.png&w=256&q=75',
  providers: ['wss://westend-asset-hub-rpc.polkadot.io'],
  symbol: 'WND',
  decimals: 12,
  faucetUrl: 'https://faucet.polkadot.io',
  subscanUrl: 'https://assethub-westend.subscan.io',
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
