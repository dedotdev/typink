import { Box, Flex, VStack } from '@chakra-ui/react';
import BalanceInsufficientAlert from '@/components/shared/BalanceInsufficientAlert.tsx';
import MainFooter from '@/components/shared/MainFooter';
import MainHeader from '@/components/shared/MainHeader';
import NetworkStatusDashboard from '@/components/NetworkStatusDashboard';
import MultiNetworkBalanceDashboard from '@/components/MultiNetworkBalanceDashboard';
import { usePolkadotClient, useTypink } from 'typink';

function App() {
  const { networks } = useTypink();
  const [assethub, people] = networks;
  const { status: relayStatus } = usePolkadotClient();
  const { status: assetHubStatus } = usePolkadotClient(assethub?.id);
  const { status: peopleStatus } = usePolkadotClient(people?.id);

  console.log('relayStatus', relayStatus);
  console.log('assetHubStatus', assetHubStatus);
  console.log('peopleStatus', peopleStatus);
  console.log('=====');

  return (
    <Flex direction='column' minHeight='100vh'>
      <MainHeader />
      <Box maxWidth='760px' mx='auto' my={4} px={4} flex={1} w='full'>
        <BalanceInsufficientAlert />
        <VStack spacing={6} align='stretch'>
          <NetworkStatusDashboard />
          <MultiNetworkBalanceDashboard />
        </VStack>
      </Box>
      <MainFooter />
    </Flex>
  );
}

export default App;
