import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from '@/App';
import { theme } from '@/theme';
import { deployments } from '@/contracts/deployments';
import {
  alephZero,
  ExtensionWallet,
  polkadotjs,
  ReactToastifyAdapter,
  setupTxToaster,
  subwallet,
  talisman,
  TypinkProvider,
  WalletConnect,
} from 'typink';
import { toast } from 'react-toastify';

setupTxToaster({ adapter: new ReactToastifyAdapter(toast) });

const DEFAULT_CALLER = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
const SUPPORTED_NETWORK = [alephZero];
// if (process.env.NODE_ENV === 'development') {
//   SUPPORTED_NETWORK.push(development);
// }

export const walletConnect = new WalletConnect({
  name: 'WalletConnect',
  id: 'walletconnect',
  logo: 'https://raw.githubusercontent.com/Luno-lab/LunoKit/be5c713a42e099a6825e73c94c02c01de1a78a41/packages/core/src/config/logos/wallets/walletconnect.svg',
  projectId: 'b56e18d47c72ab683b10814fe9495694', // Default
  relayUrl: 'wss://relay.walletconnect.com',
  metadata: {
    name: 'Typink Dapp',
    description: 'Typink powered dApp',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://typink.dev',
    icons: ['https://raw.githubusercontent.com/dedotdev/typink/main/assets/typink/typink-pink-logo.png'],
  },
});

const enkrypt = new ExtensionWallet({
  name: 'Enkrypt',
  id: 'enkrypt',
  logo: 'https://raw.githubusercontent.com/enkryptcom/enKrypt/refs/heads/main/packages/extension/public/assets/img/icons/icon192.png',
  installUrl: 'https://www.enkrypt.com',
  websiteUrl: 'https://www.enkrypt.com',
});

function Root() {
  return (
    <ChakraProvider theme={theme}>
      <TypinkProvider
        appName='Demo Typink App'
        deployments={deployments}
        defaultCaller={DEFAULT_CALLER}
        supportedNetworks={SUPPORTED_NETWORK}
        defaultNetworkId={alephZero.id}
        cacheMetadata={true}
        wallets={[subwallet, talisman, polkadotjs, enkrypt, walletConnect]}>
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
