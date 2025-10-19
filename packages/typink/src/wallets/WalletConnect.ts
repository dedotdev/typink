import { Wallet, WalletOptions } from './Wallet.js';
import type { SignClientTypes } from '@walletconnect/types';
import type { IUniversalProvider, Metadata } from '@walletconnect/universal-provider';
import {
  InjectedAccount,
  InjectedAccounts,
  InjectedSigner,
  InjectedWindowProvider,
  SignerPayloadJSON,
  SignerPayloadRaw,
  SignerResult,
} from '../pjs-types.js';
import { NetworkInfo } from '../types.js';
import type { WalletConnectModal } from '@walletconnect/modal';
import { assert, DedotError, HexString } from 'dedot/utils';
import { genesisHashToCaipId, convertNetworkInfoToCaipId } from '../utils/chains.js';

export interface WalletConnectOptions extends WalletOptions {
  projectId: string;
  metadata: Metadata;
  relayUrl: string;
}

export class WalletConnect extends Wallet<WalletConnectOptions> {
  #provider?: IUniversalProvider;
  #modal?: WalletConnectModal;

  #injectedProvider?: InjectedWindowProvider;
  #supportedNetworks: NetworkInfo[] = [];

  #accountSubscribers: Set<(accounts: InjectedAccount[]) => void | Promise<void>> = new Set();
  #accounts: InjectedAccount[] = [];

  constructor(public options: WalletConnectOptions) {
    super(options);
  }

  get injectedProvider(): InjectedWindowProvider | undefined {
    return this.#injectedProvider;
  }

  get ready(): boolean {
    // WalletConnect is always "ready" since it's a protocol, not a browser extension
    // The actual initialization happens lazily when connect() is called
    return true;
  }

  get installed(): boolean {
    // WalletConnect is always "installed" since it's a protocol, not a browser extension
    return true;
  }

  get provider(): IUniversalProvider | undefined {
    return this.#provider;
  }

  setSupportedNetworks(networks: NetworkInfo[]): void {
    this.#supportedNetworks = networks;
  }

  async waitUntilReady(): Promise<void> {
    await this.#initialize();
    await this.#setupModal();
    await this.#connect();
  }

  async #connect(): Promise<void> {
    assert(this.#provider, 'WalletConnect provider not initialized');
    assert(this.#modal, 'WalletConnect modal not initialized');

    try {
      if (this.#provider.session) {
        this.#accounts = this.#getAccounts();
      } else {
        const chains = convertNetworkInfoToCaipId(this.#supportedNetworks);

        const { uri, approval } = await this.#provider.client!.connect({
          requiredNamespaces: {
            polkadot: {
              chains,
              methods: [
                'polkadot_signMessage',
                'polkadot_sendTransaction',
                'polkadot_signTransaction',
                'polkadot_requestAccounts',
              ],
              events: ['accountsChanged', 'chainChanged', 'connect'],
            },
          },
        });

        if (uri) {
          await this.#modal!.openModal({ uri });
        }

        const userCloseModal = new Promise<never>((_, reject) => {
          this.#modal!.subscribeModal((state: { open: boolean }) => {
            !state.open && reject(new DedotError('User closed WalletConnect modal'));
          });
        });

        this.#provider.session = await Promise.race([approval(), userCloseModal]);
        this.#modal!.closeModal();
        this.#accounts = this.#getAccounts();
      }

      this.#subscribeToSessionEvents();
      this.#notifyAccountSubscribers(this.#accounts);
      this.#injectedProvider = this.#getInjectedProvider();
    } catch (e) {
      throw new DedotError(`Failed to connect WalletConnect: ${(e as Error).message}`);
    }
  }

  async #initialize(): Promise<void> {
    if (this.#provider) return;

    const { projectId, relayUrl, metadata } = this.options;

    assert(
      this.options.projectId,
      `${this.name} requires a projectId. Please visit https://cloud.walletconnect.com to get one.`,
    );

    const { UniversalProvider } = await import('@walletconnect/universal-provider');

    try {
      this.#provider = await UniversalProvider.init({
        projectId,
        relayUrl,
        metadata,
      });
    } catch (e) {
      throw new DedotError(`Failed to initialize WalletConnect: ${(e as Error).message}`);
    }
  }

  async #setupModal(): Promise<void> {
    if (this.#modal) return;

    try {
      const WalletConnectModalModule = await import('@walletconnect/modal');
      const WalletConnectModal = WalletConnectModalModule.WalletConnectModal;

      this.#modal = new WalletConnectModal({
        projectId: this.options.projectId,
      });

      // Find out a way to do it properly
      this.#modal!.setTheme({
        themeVariables: {
          '--wcm-z-index': '9999',
        },
      });
    } catch (e) {
      throw new DedotError(`Failed to initialize WalletConnect Modal: ${(e as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.#provider) return;

    try {
      await Promise.race([
        this.#provider.disconnect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Disconnect timeout')), 5000)),
      ]);
    } catch (e) {}

    this.#cleanUp();
  }

  #cleanUp() {
    this.#provider = undefined;
    this.#injectedProvider = undefined;
    this.#accountSubscribers.clear();
  }

  #getAccounts(): InjectedAccount[] {
    if (!this.#provider?.session) return [];

    const accounts: InjectedAccount[] = [];
    const polkadotNamespace = this.#provider.session.namespaces.polkadot;

    if (polkadotNamespace && polkadotNamespace.accounts) {
      // Get unique addresses across all chains
      const uniqueAddresses = new Set<string>();

      for (const account of polkadotNamespace.accounts) {
        // WalletConnect account format: "polkadot:{genesisHash}:{address}"
        const parts = account.split(':');
        if (parts.length >= 3) {
          const address = parts.slice(2).join(':'); // Handle addresses with colons
          uniqueAddresses.add(address);
        }
      }

      uniqueAddresses.forEach((address) => {
        accounts.push({ address });
      });
    }

    return accounts;
  }

  #getSigner(): InjectedSigner {
    return {
      signPayload: async (payload: SignerPayloadJSON): Promise<SignerResult> => {
        assert(this.#provider?.client && this.#provider?.session, 'Provider client or session not initialized');

        try {
          const result = (await this.#provider.client.request({
            topic: this.#provider.session.topic,
            chainId: genesisHashToCaipId(payload.genesisHash),
            request: {
              method: 'polkadot_signTransaction',
              params: {
                address: payload.address,
                transactionPayload: payload,
              },
            },
          })) as { signature: string };

          return {
            id: 0,
            signature: result.signature as HexString,
          };
        } catch (error) {
          throw new DedotError(`Failed to sign payload with WalletConnect: ${(error as Error).message}`);
        }
      },

      signRaw: async (raw: SignerPayloadRaw): Promise<SignerResult> => {
        assert(this.#provider?.client && this.#provider?.session, 'Provider client or session not initialized');

        try {
          // We choose the first one in the list because it is required to be one of the chain IDs
          // that were requested during session creation, so we cannot make it to use a default one (e.g., polkadot mainnet)
          const chainId = this.#provider.session.namespaces.polkadot.chains![0];

          const result = (await this.#provider.client.request({
            topic: this.#provider.session.topic,
            chainId,
            request: {
              method: 'polkadot_signMessage',
              params: {
                address: raw.address,
                message: raw.data,
                type: raw.type,
              },
            },
          })) as { signature: string };

          return {
            id: 0,
            signature: result.signature as HexString,
          };
        } catch (error) {
          throw new DedotError(`Failed to sign raw message with WalletConnect: ${(error as Error).message}`);
        }
      },
    };
  }

  #getInjectedAccounts(): InjectedAccounts {
    return {
      get: async (): Promise<InjectedAccount[]> => {
        return this.#getAccounts();
      },

      subscribe: (callback: (accounts: InjectedAccount[]) => void | Promise<void>): (() => void) => {
        this.#accountSubscribers.add(callback);

        // Immediately call with current accounts
        callback(this.#getAccounts());

        // Return unsubscribe function
        return () => {
          this.#accountSubscribers.delete(callback);
        };
      },
    };
  }

  #getInjectedProvider(): InjectedWindowProvider {
    const signer = this.#getSigner();
    const accounts = this.#getInjectedAccounts();

    return {
      enable: async (_origin: string): Promise<{ accounts: InjectedAccounts; signer: InjectedSigner }> => {
        if (!this.#provider?.session) {
          throw new Error('WalletConnect session not established');
        }

        return {
          accounts,
          signer,
        };
      },

      version: '1.0.0',
    };
  }

  #subscribeToSessionEvents(): void {
    assert(this.#provider?.client && this.#provider?.session, 'Provider client or session not initialized');

    this.#provider.client.on(
      'session_update',
      ({ topic, params }: SignClientTypes.EventArguments['session_update']) => {
        const { namespaces } = params;
        const session = this.#provider!.client!.session.get(topic);
        this.#provider!.session! = { ...session, namespaces };

        // Notify account subscribers
        const accounts = this.#getAccounts();
        this.#notifyAccountSubscribers(accounts);
      },
    );

    this.#provider.client.on('session_delete', () => {
      this.#provider!.session = undefined;
      this.#injectedProvider = undefined;

      // Notify subscribers that accounts are gone
      this.#notifyAccountSubscribers([]);
    });
  }

  #notifyAccountSubscribers(accounts: InjectedAccount[]): void {
    this.#accountSubscribers.forEach((callback) => {
      try {
        callback(accounts);
      } catch (error) {
        console.error('Error in account subscriber callback:', error);
      }
    });
  }
}
