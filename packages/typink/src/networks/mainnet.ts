import { JsonRpcApi, NetworkInfo } from '../types.js';

export const alephZero: NetworkInfo = {
  id: 'alephzero',
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
  name: 'Astar',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/astar.png',
  providers: ['wss://rpc.astar.network'],
  symbol: 'ASTR',
  decimals: 18,
  subscanUrl: 'https://astar.subscan.io',
};

export const shiden: NetworkInfo = {
  id: 'astar_shiden',
  name: 'Shiden',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/shiden.png',
  providers: ['wss://rpc.shiden.astar.network'],
  symbol: 'SDN',
  decimals: 18,
  subscanUrl: 'https://shiden.subscan.io',
};
