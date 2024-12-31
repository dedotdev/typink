import { JsonRpcApi, NetworkInfo } from '../types';

export const alephZero: NetworkInfo = {
  id: 'alephzero',
  name: 'Aleph Zero',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/alephzero.svg',
  provider: 'wss://ws.azero.dev',
  symbol: 'AZERO',
  decimals: 12,
  jsonRpcApi: JsonRpcApi.LEGACY,
};

export const astar: NetworkInfo = {
  id: 'astar',
  name: 'Astar',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/astar.png',
  provider: 'wss://rpc.astar.network',
  symbol: 'ASTR',
  decimals: 18,
};

export const shiden: NetworkInfo = {
  id: 'astar_shiden',
  name: 'Shiden',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/networks/shiden.png',
  provider: 'wss://rpc.shiden.astar.network',
  symbol: 'SDN',
  decimals: 18,
};
