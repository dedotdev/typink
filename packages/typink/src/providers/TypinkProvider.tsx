import { createContext } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { ClientContextProps, ClientProvider, ClientProviderProps, useClient } from './ClientProvider.js';
import { useWallet, WalletContextProps } from './WalletProvider.js';
import { ContractDeployment, SubstrateAddress } from '../types.js';
import { VersionedGenericSubstrateApi } from 'dedot/types';
import { SubstrateApi } from 'dedot/chaintypes';
import {
  useWalletSetup,
  WalletSetupContextProps,
  WalletSetupProvider,
  WalletSetupProviderProps,
} from './WalletSetupProvider.js';
import { TypinkEventsContextProps, TypinkEventsProvider, useTypinkEvents } from './TypinkEventsProvider.js';

const DEFAULT_ADDRESS = '5FTZ6n1wY3GBqEZ2DWEdspbTarvRnp8DM8x2YXbWubu7JN98';

export interface TypinkContextProps<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi>
  extends ClientContextProps<ChainApi>,
    WalletSetupContextProps,
    WalletContextProps,
    TypinkEventsContextProps {
  deployments: ContractDeployment[];
  defaultCaller: SubstrateAddress;
}

export const TypinkContext = createContext<TypinkContextProps<any>>({} as any);

export interface TypinkProviderProps extends ClientProviderProps, WalletSetupProviderProps {
  deployments?: ContractDeployment[];
  defaultCaller?: SubstrateAddress;
}

export type TypinkProviderInnerProps = Omit<TypinkProviderProps, 'appName'>;

function TypinkProviderInner<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi>({
  children,
  deployments = [],
  defaultCaller = DEFAULT_ADDRESS,
}: TypinkProviderInnerProps) {
  const clientContext = useClient<ChainApi>();
  const walletSetupContext = useWalletSetup();
  const walletContext = useWallet();
  const typinkEventsContext = useTypinkEvents();

  return (
    <TypinkContext.Provider
      value={
        {
          ...typinkEventsContext,
          ...clientContext,
          ...walletSetupContext,
          ...walletContext,
          deployments,
          defaultCaller,
        } as TypinkContextProps<ChainApi>
      }>
      {children}
    </TypinkContext.Provider>
  );
}

/**
 * TypinkProvider is the main provider component for the Typink application.
 * It wraps other providers (WalletSetupProvider, ClientProvider ...) to provide a complete context for the application.
 *
 * @param props - The properties for the TypinkProvider component
 * @param props.children - The child components to be rendered within the provider
 * @param props.deployments - An array of contract deployments (optional, defaults to empty array)
 * @param props.defaultCaller - The default substrate address to be used as the caller (optional, defaults to ALICE address)
 * @param props.defaultNetworkId - The default network ID to be used
 * @param props.cacheMetadata - Whether to cache metadata or not (default: false)
 * @param props.supportedNetworks - An array of supported networks
 * @param props.signer - The signer to be used for signing transactions. If using an external wallet connector
 *                       (e.g., SubConnect or Talisman Connect), pass this prop to override Typink's
 *                       internal signer management.
 * @param props.connectedAccount - The currently connected account. If using an external wallet connector,
 *                                 pass this prop to inform Typink which account to interact with or
 *                                 sign transactions.
 *
 * Note: By default, Typink manages signer and connectedAccount internally when using the built-in
 * Typink Wallet Connector. For external wallet connectors, you must provide both signer and
 * connectedAccount props to ensure proper functionality.
 */
export function TypinkProvider({
  children,
  deployments = [],
  defaultCaller = DEFAULT_ADDRESS,
  defaultNetworkId,
  cacheMetadata = false,
  supportedNetworks,
  signer,
  connectedAccount,
  wallets,
  appName,
}: TypinkProviderProps) {
  return (
    <JotaiProvider>
      <WalletSetupProvider signer={signer} connectedAccount={connectedAccount} wallets={wallets} appName={appName}>
        <ClientProvider
          defaultNetworkId={defaultNetworkId}
          cacheMetadata={cacheMetadata}
          supportedNetworks={supportedNetworks}>
          <TypinkEventsProvider>
            <TypinkProviderInner deployments={deployments} defaultCaller={defaultCaller}>
              {children}
            </TypinkProviderInner>
          </TypinkEventsProvider>
        </ClientProvider>
      </WalletSetupProvider>
    </JotaiProvider>
  );
}
