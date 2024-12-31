import { ExtensionWallet } from './ExtensionWallet.js';

export * from './Wallet.js';
export * from './ExtensionWallet.js';

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
