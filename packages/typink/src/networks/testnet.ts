import { JsonRpcApi, NetworkInfo } from '../types.js';

export const popTestnet: NetworkInfo = {
  id: 'pop_testnet',
  name: 'POP Testnet',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/pop-network.svg',
  provider: 'wss://rpc1.paseo.popnetwork.xyz',
  symbol: 'PAS',
  decimals: 10,
  faucetUrl: 'https://onboard.popnetwork.xyz',
};

export const alephZeroTestnet: NetworkInfo = {
  id: 'alephzero_testnet',
  name: 'Aleph Zero Testnet',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/alephzero.svg',
  provider: 'wss://ws.test.azero.dev',
  symbol: 'TZERO',
  decimals: 12,
  faucetUrl: 'https://faucet.test.azero.dev',
  jsonRpcApi: JsonRpcApi.LEGACY,
};

export const shibuyaTestnet: NetworkInfo = {
  id: 'astar_shibuya',
  name: 'Shibuya',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/shiden.png',
  provider: 'wss://rpc.shibuya.astar.network',
  symbol: 'SBY',
  decimals: 18,
  faucetUrl: 'https://docs.astar.network/docs/build/environment/faucet',
};
