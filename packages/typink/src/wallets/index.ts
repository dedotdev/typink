import { ExtensionWallet } from './ExtensionWallet.js';
import { WalletConnect } from './WalletConnect.js';

export * from './Wallet.js';
export * from './ExtensionWallet.js';
export * from './WalletConnect.js';

export const subwallet = new ExtensionWallet({
  name: 'SubWallet',
  id: 'subwallet-js',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/wallets/subwallet-logo.svg',
  installUrl: 'https://www.subwallet.app/download.html',
  websiteUrl: 'https://www.subwallet.app',
});

export const talisman = new ExtensionWallet({
  name: 'Talisman',
  id: 'talisman',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/wallets/talisman-logo.svg',
  installUrl: 'https://talisman.xyz/download',
  websiteUrl: 'https://talisman.xyz',
});

export const polkadotjs = new ExtensionWallet({
  name: 'Polkadot{.js}',
  id: 'polkadot-js',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/refs/heads/main/assets/wallets/polkadot-js-logo.svg',
  installUrl: 'https://polkadot.js.org/extension',
  websiteUrl: 'https://polkadot.js.org',
});

export const walletConnect = new WalletConnect({
  name: 'WalletConnect',
  id: 'walletconnect',
  logo: 'https://raw.githubusercontent.com/dedotdev/typink/feature/wallet-connect/assets/wallets/wallet-connect-logo.svg',
  projectId: 'b56e18d47c72ab683b10814fe9495694', // Default project ID, please create your own at https://cloud.walletconnect.com
  relayUrl: 'wss://relay.walletconnect.com',
  metadata: {
    name: 'Typink Dapp',
    description: 'Typink powered dApp',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://typink.dev',
    icons: ['https://raw.githubusercontent.com/dedotdev/typink/main/assets/typink/typink-pink-logo.png'],
  },
});
