import { Wallet, WalletOptions } from './Wallet.js';
import { LedgerConnect } from '../signers';

abstract class HardwareWallet extends Wallet {}

export interface HardwareWalletOptions extends WalletOptions {
  // Add any hardware-specific options here if needed
}

export class LedgerWallet extends HardwareWallet {
  private _connect?: LedgerConnect;

  getConnect(): LedgerConnect {
    if (!this._connect) {
      this._connect = new LedgerConnect();
    }
    return this._connect;
  }

  get ready(): boolean {
    // Hardware wallets are considered "ready" if they can be connected to
    return typeof window !== 'undefined' && 'navigator' in window && 'usb' in navigator;
  }

  get installed(): boolean {
    return this.ready;
  }
}

export class WalletConnect extends HardwareWallet {}

export class PolkadotVault extends HardwareWallet {}
