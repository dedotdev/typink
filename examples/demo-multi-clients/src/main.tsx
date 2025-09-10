import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from '@/App';
import { theme } from '@/theme';
import {
  development,
  kusama,
  kusamaAssetHub,
  kusamaPeople,
  paseo,
  paseoAssetHub,
  paseoPeople,
  polkadot,
  polkadotAssetHub,
  polkadotjs,
  polkadotPeople,
  ReactToastifyAdapter,
  setupTxToaster,
  subwallet,
  talisman,
  TypinkProvider,
} from 'typink';

setupTxToaster({
  adapter: new ReactToastifyAdapter(toast),
});

// Define supported networks focusing on the three main ecosystems
const SUPPORTED_NETWORK = [
  // Polkadot ecosystem
  polkadot,
  polkadotAssetHub,
  polkadotPeople,

  // Kusama ecosystem
  kusama,
  kusamaAssetHub,
  kusamaPeople,

  // Paseo ecosystem (testnet)
  paseo,
  paseoAssetHub,
  paseoPeople,
];

if (process.env.NODE_ENV === 'development') {
  SUPPORTED_NETWORK.push(development);
}

function Root() {
  return (
    <ChakraProvider theme={theme}>
      <TypinkProvider
        supportedNetworks={SUPPORTED_NETWORK}
        defaultNetworkIds={[polkadot.id, polkadotAssetHub.id, polkadotPeople.id]}
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
