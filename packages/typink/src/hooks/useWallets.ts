import { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { ExtensionWallet, Wallet } from '../wallets/index.js';

const A_WALLETS: Wallet[] = [
  new ExtensionWallet({
    name: 'SubWallet',
    id: 'subwallet-js',
    logo: '/subwallet-logo.svg',
    installUrl: '',
  }),
  new ExtensionWallet({
    name: 'Talisman',
    id: 'talisman',
    logo: '/talisman-logo.svg',
    installUrl: '',
  }),
  new ExtensionWallet({
    name: 'Polkadot{.js}',
    id: 'polkadot-js',
    logo: '/polkadot-js-logo.svg',
    installUrl: '',
  }),
];

export function useWallets(): Wallet[] {
  const [wallets, setWallets] = useState<Wallet[]>(A_WALLETS);

  useEffectOnce(() => {
    for (let wallet of wallets) {
      wallet
        .initialize()
        .then(() => {
          setWallets([...wallets]);
        })
        .catch(() => {
          // TODO: handle error here!
        });
    }
  });

  return wallets;
}
