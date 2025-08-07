import { Wallet, WalletOptions } from './Wallet.js';
import { InjectedWindow, InjectedWindowProvider } from 'src/pjs-types';

export interface ExtensionWalletOptions extends WalletOptions {
  installUrl: string;
  websiteUrl?: string;
}

export class ExtensionWallet extends Wallet<ExtensionWalletOptions> {
  get installUrl() {
    return this.options.installUrl;
  }

  get websiteUrl() {
    return this.options.websiteUrl;
  }

  get installed() {
    return this.ready;
  }

  get injectedWeb3(): Record<string, InjectedWindowProvider> {
    const injectedWindow = window as Window & InjectedWindow;

    if (!injectedWindow.injectedWeb3) {
      injectedWindow.injectedWeb3 = {};
    }

    return injectedWindow.injectedWeb3;
  }

  get injectedProvider(): InjectedWindowProvider {
    return this.injectedWeb3[this.id];
  }

  get ready() {
    return !!this.injectedProvider;
  }

  get version() {
    return this.injectedProvider?.version;
  }
}
