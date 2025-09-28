'use client';

import { deployments } from '@/contracts/deployments';
import { Props } from '@/lib/types';
import { passetHub, polkadotjs, subwallet, talisman, TypinkProvider, setupTxToaster, SonnerAdapter } from 'typink';
import { toast } from 'sonner';

// Supported networks configuration
const SUPPORTED_NETWORKS = [
  // -- START_SUPPORTED_NETWORKS --
  passetHub,
  // -- END_SUPPORTED_NETWORKS --
];
// Uncomment the following lines to enable the development network: https://github.com/paritytech/substrate-contracts-node
// if (process.env.NODE_ENV === "development") {
//   SUPPORTED_NETWORKS.push(development);
// }

// Supported wallets
const SUPPORTED_WALLETS = [subwallet, talisman, polkadotjs];

setupTxToaster({
  adapter: new SonnerAdapter(toast),
});

export function AppProvider({ children }: Props) {
  return (
    <TypinkProvider
      appName='Typink Template'
      deployments={deployments}
      supportedNetworks={SUPPORTED_NETWORKS}
      defaultNetworkId={
        // -- START_DEFAULT_NETWORK_ID --
        passetHub.id
        // -- END_DEFAULT_NETWORK_ID --
      }
      cacheMetadata={true}
      wallets={SUPPORTED_WALLETS}>
      {children}
    </TypinkProvider>
  );
}
