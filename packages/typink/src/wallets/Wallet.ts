import { TypinkError } from '../utils/index.js';

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

  get version(): string | undefined {
    throw new TypinkError('Not implemented');
  }

  get ready(): boolean {
    throw new TypinkError('Not implemented');
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
