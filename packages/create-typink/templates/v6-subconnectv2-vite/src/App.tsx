import { Box, Flex } from '@chakra-ui/react';
import MainBoard from '@/components/MainBoard.tsx';
import BalanceInsufficientAlert from '@/components/shared/BalanceInsufficientAlert.tsx';
import MainFooter from '@/components/shared/MainFooter';
import MainHeader from '@/components/shared/MainHeader';
import TypinkIntroduction from '@/components/shared/TypinkIntroduction.tsx';
import NonMappedAccountAlert from './components/shared/NonMappedAccountAlert';

export function TypinkApp() {
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


export default function App() {
  return (
    <Flex direction='column' minHeight='100vh'>
      <MainHeader />
      <Box maxWidth='container.lg' mx='auto' my={12} px={4} flex={1} w='full'>
        <TypinkIntroduction />

        <Box mt={8} mx={{ base: 0, md: 32 }}>
          <BalanceInsufficientAlert />
          <NonMappedAccountAlert />
          <MainBoard />
        </Box>
      </Box>
      <MainFooter />
    </Flex>
  );
}
