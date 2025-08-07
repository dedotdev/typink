import { Wallet } from './Wallet.js';
import type TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { type PolkadotGenericApp } from '@zondax/ledger-substrate';
import { InjectedSigner } from '../pjs-types';
import { TypinkError } from '../utils';

abstract class HardwareWallet extends Wallet {}

interface LedgerAccount {
  index: number;
  address: string;
  publicKey: string;
}

let transport: TransportWebHID;

export class LedgerWallet extends HardwareWallet {
  transport?: TransportWebHID;
  app?: PolkadotGenericApp;

  async init() {
    await this.ensureClosed();
    console.log('== initialize ==');

    // polyfill this using global object
    if (typeof window !== 'undefined') {
      const { Buffer } = await import('buffer');
      window.Buffer = Buffer;
    }

    const { default: TransportWebHID } = await import('@ledgerhq/hw-transport-webhid');
    const { PolkadotGenericApp } = await import('@zondax/ledger-substrate');

    try {
      this.transport = (await TransportWebHID.openConnected())!;
      if (!this.transport) {
        this.transport = (await TransportWebHID.create()) as TransportWebHID;
      }
      this.app = new PolkadotGenericApp(this.transport);
    } catch (error) {
      const devices = await TransportWebHID.list();
      devices.forEach((device) => {
        device.close();
      });

      throw error;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (this.transport && this.app) {
      return;
    }

    await this.init();
  }

  async ensureClosed(): Promise<void> {
    if (this.transport && this.app) {
      console.log('==closing==');
      await this.transport.close();
      console.log('==closed==');
      this.transport = undefined;
      this.app = undefined;
    }
  }

  async getSS58Address(index: number, ss58Prefix: number = 42): Promise<LedgerAccount> {
    await this.ensureInitialized();
    const bip42Path = `m/44'/354'/${index}'/${0}'/${0}'`;
    console.log('bip42Path', bip42Path);

    const result = await this.app!.getAddressEd25519(bip42Path, ss58Prefix, false);

    await this.ensureClosed();

    return { index, address: result.address, publicKey: result.pubKey };
  }

  async getSigner(): Promise<InjectedSigner> {
    throw new TypinkError();
  }
}

export class WalletConnect extends HardwareWallet {}

export class PolkadotVault extends HardwareWallet {}
