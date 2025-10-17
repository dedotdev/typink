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
  genesisHash: '0xe8b2d197b82a0da1fffca832c050894ebe343b289c61ef439aa694bdcef78aa1',
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
  genesisHash: '0xddb89973361a170839f80f152d2e9e38a376a5a7eccefcade763f46a8e567019',
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
    return (await import('@substrate/connect-known-chains/westend2')).chainSpec;
  },
  genesisHash: '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e',
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
    return (await import('@substrate/connect-known-chains/westend2_asset_hub')).chainSpec;
  },
  relayChain: westend,
  genesisHash: '0x67f9723393ef76214df0118c34bbbd3dbebc8ed46a10973a8c969d48fe7598c9',
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
    return (await import('@substrate/connect-known-chains/westend_people')).chainSpec;
  },
  relayChain: westend,
  genesisHash: '0x1eb6fb0ba5187434de017a70cb84d4f47142df1d571d0ef9e7e1407f2b80b93c',
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
    return (await import('@substrate/connect-known-chains/paseo')).chainSpec;
  },
  genesisHash: '0x77afd6190f1554ad45fd0d31aee62aacc33c6db0ea801129acb813f913e0764f',
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
  genesisHash: '0xe6c30d6e148f250b887105237bcaa5cb9f16dd203bf7b5b9d4f1da7387cb86ec',
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
  genesisHash: '0xd6eec26135305a8ad257a20d003357284c8aa03d0bdb2b357ab0a22371e11ef2',
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
  genesisHash: '0xfd974cf9eaf028f5e44b9fdd1949ab039c6cf9cc54449b0b60d71b042e79aeb6',
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
  genesisHash: '0x05fab032a899566268235e3c89c847fb4644558a0d856282d47d17ff06cb2020',
};
