import { ChakraProvider } from '@chakra-ui/react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import { theme } from '@/theme';
import { deployments } from '@/contracts/deployments';
import {
  alephZeroTestnet,
  development,
  popTestnet,
  setupTxToaster,
  SonnerAdapter,
  TypinkAccount,
  TypinkProvider,
} from 'typink';
import { config } from '@/config.ts';
import { Toaster } from '@/components/shared/Toaster.tsx';
import { toast } from 'sonner';
import { LunoKitProvider } from '@luno-kit/ui'
import '@luno-kit/ui/styles.css'
import { useAccount, useSigner } from '@luno-kit/react';
import { useMemo } from 'react';

const DEFAULT_CALLER = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
const SUPPORTED_NETWORK = [popTestnet, alephZeroTestnet];
if (process.env.NODE_ENV === 'development') {
  SUPPORTED_NETWORK.push(development);
}

setupTxToaster({
  adapter: new SonnerAdapter(toast),
});

function TypinApp() {
  const { data: signer } = useSigner();
  const { account } = useAccount();

  const typinkAccount: TypinkAccount | undefined = useMemo(() => {
    if (!account) return;
    return {
      address: account.address,
      name: account.name,
      source: account.meta?.source || 'lunokit'
    }
  }, [account]);

  return (
    <TypinkProvider
      appName='Demo Typink + LunoKIt App'
      deployments={deployments}
      defaultCaller={DEFAULT_CALLER}
      supportedNetworks={SUPPORTED_NETWORK}
      defaultNetworkId={popTestnet.id}
      cacheMetadata={true}
      signer={signer}
      connectedAccount={typinkAccount}>
      <App />
      <Toaster />
    </TypinkProvider>
  );
}

function Root() {
  return (
    <ChakraProvider theme={theme}>
      <LunoKitProvider config={config}>
        <TypinApp />
      </LunoKitProvider>
    </ChakraProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<Root />);
