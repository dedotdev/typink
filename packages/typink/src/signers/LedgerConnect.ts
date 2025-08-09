import type TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { type PolkadotGenericApp } from '@zondax/ledger-substrate';
import { InjectedSigner, SignerPayloadJSON, SignerPayloadRaw, SignerResult } from '../pjs-types';
import { TypinkError } from '../utils';
import { MerkleizedMetadata } from 'dedot/merkleized-metadata';
import { ExtraSignedExtension, ISubstrateClient } from 'dedot';
import { assert, HexString, hexToU8a, u8aToHex } from 'dedot/utils';
import { NetworkInfo, TypinkAccount } from 'src/types';
import { AccountId32 } from 'dedot/codecs';

export interface LedgerAccount {
  index: number;
  address: string;
  publicKey: string;
}

class LedgerInjectedSigner implements InjectedSigner {
  constructor(
    private ledger: LedgerConnect,
    private client: ISubstrateClient,
    private network: NetworkInfo,
    private importedAccounts: TypinkAccount[],
  ) {}

  async signPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    await this.ledger.ensureInitialized();

    const merkleizer = new MerkleizedMetadata(this.client.metadata, {
      decimals: this.network.decimals,
      tokenSymbol: this.network.symbol,
    });

    const extra = new ExtraSignedExtension(
      this.client, // --
      { signerAddress: payload.address },
    );

    await extra.fromPayload(payload);

    const toSign = extra.toRawPayload(payload.method).data;
    const proof = merkleizer.proofForExtrinsicPayload(toSign as HexString);

    const account = this.importedAccounts.find((a) => new AccountId32(a.address).eq(payload.address));
    assert(account, 'Account Not Found');

    const bip42Path = `m/44'/354'/${account.index}'/${0}'/${0}'`;

    const toSignBuffer = Buffer.from(hexToU8a(toSign));
    const buff = Buffer.from(proof);
    const result = await this.ledger.app!.signWithMetadataEd25519(bip42Path, toSignBuffer, buff);

    await this.ledger.ensureClosed();

    return {
      id: Date.now(), // --
      signature: u8aToHex(result.signature),
    };
  }

  async signRaw(_raw: SignerPayloadRaw): Promise<SignerResult> {
    // TODO: Implement Ledger raw signing using this.ledgerConnect
    throw new TypinkError('Ledger raw signing not yet implemented');
  }
}

export class LedgerConnect {
  public transport?: TransportWebHID;
  public app?: PolkadotGenericApp;

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

  getSigner(
    client: ISubstrateClient, // --
    network: NetworkInfo,
    importedAccounts: TypinkAccount[],
  ): InjectedSigner {
    return new LedgerInjectedSigner(this, client, network, importedAccounts);
  }

  get isConnected(): boolean {
    return !!(this.transport && this.app);
  }
}
