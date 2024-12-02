import { InjectedWindow } from '@polkadot/extension-inject/types';

export interface WalletOptions {
  id: string;
  name: string;
  logo: string;
}

export abstract class Wallet<Options extends WalletOptions = WalletOptions> {
  constructor(public options: Options) {}

  get id() {
    return this.options.id;
  }

  get name() {
    return this.options.name;
  }

  get logo() {
    return this.options.logo;
  }

  get version() {
    return this.injectedProvider?.version;
  }

  get injectedWeb3() {
    const injectedWindow = window as Window & InjectedWindow;

    if (!injectedWindow.injectedWeb3) {
      injectedWindow.injectedWeb3 = {};
    }

    return injectedWindow.injectedWeb3;
  }

  get injectedProvider() {
    return this.injectedWeb3[this.id];
  }

  get ready() {
    return !!this.injectedProvider;
  }

  get installed() {
    return false;
  }

  async waitUntilReady() {
    return new Promise<void>((resolve) => {
      if (this.ready) {
        resolve();
        return;
      }

      const interval = setInterval(() => {
        if (this.ready) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });
  }
}
