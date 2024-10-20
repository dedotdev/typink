import { Wallet, WalletOptions } from './Wallet.js';

export interface ExtensionWalletOptions extends WalletOptions {
  installUrl: string;
}

export class ExtensionWallet extends Wallet<ExtensionWalletOptions> {
  get installUrl() {
    return this.options.installUrl;
  }

  get installed() {
    return this.ready;
  }
}
