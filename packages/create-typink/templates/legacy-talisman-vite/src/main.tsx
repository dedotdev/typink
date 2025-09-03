import { ChakraProvider } from '@chakra-ui/react';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from '@/App';
import { AppProvider } from '@/providers/AppProvider.tsx';
import { theme } from '@/theme';
import { deployments } from '@/contracts/deployments';
import { TypinkProvider, {{ SUPPORTED_NETWORKS }} } from 'typink';

import { WalletConnectorProvider, useWalletConnector } from '@/providers/WalletConnectorProvider.tsx';

const DEFAULT_CALLER = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice

// Supported networks configuration
const SUPPORTED_NETWORKS = [ {{ SUPPORTED_NETWORKS }} ];
// Uncomment to add support for development contracts node: https://github.com/paritytech/substrate-contracts-node
// if (process.env.NODE_ENV === 'development') {
//   SUPPORTED_NETWORKS.push(development);
// }

const root = createRoot(document.getElementById('root') as HTMLElement);

function TypinkApp() {
  const { wallet, connectedAccount } = useWalletConnector();

  return (
    <ChakraProvider theme={theme}>
      <TypinkProvider
        appName='Typink Dapp'
        deployments={deployments}
        defaultCaller={DEFAULT_CALLER}
        defaultNetworkId={ {{ DEFAULT_NETWORK_ID }} }
        supportedNetworks={SUPPORTED_NETWORKS}
        signer={wallet?.signer}
        connectedAccount={connectedAccount}>
        <AppProvider>
          <App />
          <ToastContainer
            position='top-right'
            closeOnClick
            pauseOnHover
            theme='light'
            autoClose={5_000}
            hideProgressBar
            limit={2}
          />
        </AppProvider>
      </TypinkProvider>
    </ChakraProvider>
  );
}

root.render(
  <WalletConnectorProvider>
    <TypinkApp />
  </WalletConnectorProvider>,
);
