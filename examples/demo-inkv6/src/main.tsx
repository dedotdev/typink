import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from '@/App';
import { theme } from '@/theme';
import { deployments } from '@/contracts/deployments';
import { development, polkadotjs, popTestnet, subwallet, talisman, TypinkProvider, westendAssetHub } from 'typink';

const DEFAULT_CALLER = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
const SUPPORTED_NETWORK = [popTestnet, westendAssetHub];
if (process.env.NODE_ENV === 'development') {
  SUPPORTED_NETWORK.push(development);
}

function Root() {
  return (
    <ChakraProvider theme={theme}>
      <TypinkProvider
        appName='Demo Typink App'
        deployments={deployments}
        defaultCaller={DEFAULT_CALLER}
        supportedNetworks={SUPPORTED_NETWORK}
        defaultNetworkId={popTestnet.id}
        cacheMetadata={true}
        wallets={[subwallet, talisman, polkadotjs]}>
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
    </ChakraProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
