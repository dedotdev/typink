import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from '@/App';
import { theme } from '@/theme';
import { deployments } from '@/contracts/deployments';
import {
  development,
  polkadotjs,
  popTestnet,
  ReactToastifyAdapter,
  setupTxToaster,
  subwallet,
  talisman,
  TypinkProvider,
  westendAssetHub,
} from 'typink';

setupTxToaster({
  adapter: new ReactToastifyAdapter(toast),
});

const SUPPORTED_NETWORK = [popTestnet, westendAssetHub];
if (process.env.NODE_ENV === 'development') {
  SUPPORTED_NETWORK.push(development);
}

function Root() {
  return (
    <ChakraProvider theme={theme}>
      <TypinkProvider
        deployments={deployments}
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
