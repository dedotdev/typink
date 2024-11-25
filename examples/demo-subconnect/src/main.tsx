import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from '@/App';
import { theme } from '@/theme';
import { deployments } from '@/contracts/deployments';
import { alephZeroTestnet, development, popTestnet, TypinkProvider } from 'typink';
import { useConnectWallet, Web3OnboardProvider } from '@subwallet-connect/react';
import { onboardWallets } from '@/onboard-wallets.ts';
import { AppProvider, useApp } from '@/providers/AppProvider.tsx';

const DEFAULT_CALLER = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
const SUPPORTED_NETWORK = [popTestnet, alephZeroTestnet];
if (process.env.NODE_ENV === 'development') {
  SUPPORTED_NETWORK.push(development);
}

function TypinApp() {
  const [{ wallet }] = useConnectWallet();
  const { connectedAccount } = useApp();

  return (
    <TypinkProvider
      deployments={deployments}
      defaultCaller={DEFAULT_CALLER}
      supportedNetworks={SUPPORTED_NETWORK}
      defaultNetworkId={popTestnet.id}
      cacheMetadata={true}
      signer={wallet?.signer}
      connectedAccount={connectedAccount}>
      <App />
      <ToastContainer
        position='top-right'
        closeOnClick
        pauseOnHover
        theme='light'
        autoClose={5_000}
        hideProgressBar
        limit={10}
      />
    </TypinkProvider>
  );
}

function Root() {
  return (
    <ChakraProvider theme={theme}>
      <Web3OnboardProvider web3Onboard={onboardWallets}>
        <AppProvider>
          <TypinApp />
        </AppProvider>
      </Web3OnboardProvider>
    </ChakraProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
