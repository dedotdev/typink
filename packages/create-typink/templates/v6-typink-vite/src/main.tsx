import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from '@/App';
import { AppProvider } from '@/providers/AppProvider.tsx';
import { theme } from '@/theme';
import { deployments } from '@/contracts/deployments';
import {
  TypinkProvider,
  // -- START_SUPPORTED_NETWORKS --
  passetHub,
  // -- END_SUPPORTED_NETWORKS --
} from 'typink';

const DEFAULT_CALLER = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
const SUPPORTED_NETWORKS = [
  // -- START_SUPPORTED_NETWORKS --
  passetHub,
  // -- END_SUPPORTED_NETWORKS --
];
// Uncomment to add support for development contracts node: https://github.com/paritytech/substrate-contracts-node
// if (process.env.NODE_ENV === 'development') {
//   SUPPORTED_NETWORKS.push(development);
// }

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <ChakraProvider theme={theme}>
    <TypinkProvider
      appName='Typink Dapp'
      deployments={deployments}
      defaultCaller={DEFAULT_CALLER}
      defaultNetworkId={
        // -- START_DEFAULT_NETWORK_ID --
        passetHub.id
        // -- END_DEFAULT_NETWORK_ID --
      }
      supportedNetworks={SUPPORTED_NETWORKS}>
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
  </ChakraProvider>,
);
