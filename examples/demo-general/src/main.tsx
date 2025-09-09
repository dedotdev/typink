import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import { Toaster as SonnerToaster } from 'sonner';
import { Toaster as HotToastToaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import App from '@/App';
import { theme } from '@/theme';
import {
  alephZero,
  alephZeroTestnet,
  astar,
  basilisk,
  development,
  hydration,
  kusama,
  kusamaAssetHub,
  kusamaPeople,
  paseo,
  paseoAssetHub,
  paseoHydration,
  paseoPeople,
  passetHub,
  polkadot,
  polkadotAssetHub,
  polkadotjs,
  polkadotPeople,
  popTestnet,
  shibuyaTestnet,
  shiden,
  subwallet,
  talisman,
  TypinkProvider,
  vara,
  westend,
  westendAssetHub,
  westendPeople,
} from 'typink';

const SUPPORTED_NETWORK = [
  polkadot,
  polkadotAssetHub,
  polkadotPeople,
  kusama,
  kusamaAssetHub,
  kusamaPeople,
  hydration,
  basilisk,
  vara,
  alephZero,
  astar,
  shiden,

  westend,
  westendAssetHub,
  westendPeople,
  paseo,
  paseoPeople,
  paseoAssetHub,
  passetHub,
  paseoHydration,
  popTestnet,
  alephZeroTestnet,
  shibuyaTestnet,
];

if (process.env.NODE_ENV === 'development') {
  SUPPORTED_NETWORK.push(development);
}

function Root() {
  return (
    <ChakraProvider theme={theme}>
      <TypinkProvider
        supportedNetworks={SUPPORTED_NETWORK}
        defaultNetworkId={polkadot.id}
        cacheMetadata={true}
        wallets={[subwallet, talisman, polkadotjs]}>
        <App />

        {/* Toast Providers for all libraries */}
        <ToastContainer
          position='top-right'
          closeOnClick
          pauseOnHover
          theme='light'
          autoClose={5_000}
          hideProgressBar
          limit={10}
        />
        {/* @ts-ignore */}
        <SonnerToaster position='top-right' expand={false} richColors closeButton={true} />
        {/* @ts-ignore */}
        <HotToastToaster position='top-right' gutter={8} />
      </TypinkProvider>
    </ChakraProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
