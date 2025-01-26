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
