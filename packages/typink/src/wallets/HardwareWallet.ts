import { Wallet, WalletOptions } from './Wallet.js';

// Ledger or Polkadot Vault
abstract class HardwareWallet extends Wallet {}

export interface HardwareWalletOptions extends WalletOptions {
  // Add any hardware-specific options here if needed
}

export class LedgerWallet extends HardwareWallet {
  get version(): string | undefined {
    return '';
  }

  get ready(): boolean {
    // @ts-ignore
    return typeof window !== 'undefined' && !!(window.navigator && window.navigator.hid);
  }

  get installed(): boolean {
    return this.ready;
  }
}

export class WalletConnect extends HardwareWallet {}

export class PolkadotVault extends HardwareWallet {}
