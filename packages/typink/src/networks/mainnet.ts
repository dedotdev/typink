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

export const kusamaAssetHub: NetworkInfo = {
  id: 'kusama_asset_hub',
  name: 'Kusama AssetHub',
  logo: 'https://assethub-kusama.subscan.io/_next/image?url=%2Fchains%2Fassethub-kusama%2Flogo-mini.png&w=256&q=75',
  providers: [
    'wss://rpc.ibp.network/kusama', // --
    'wss://kusama-rpc.n.dwellir.com',
    'wss://kusama.api.onfinality.io/public-ws',
  ],
  symbol: 'KSM',
  decimals: 12,
  subscanUrl: 'https://assethub-kusama.subscan.io',
};
