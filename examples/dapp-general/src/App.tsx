import { Box, Flex, VStack, Divider } from '@chakra-ui/react';
import BalanceInsufficientAlert from '@/components/shared/BalanceInsufficientAlert.tsx';
import MainFooter from '@/components/shared/MainFooter';
import MainHeader from '@/components/shared/MainHeader';
import RemarkTransactionExample from '@/components/RemarkTransactionExample';
import TransferKeepAliveExample from '@/components/TransferKeepAliveExample';

function App() {
  return (
    <Flex direction='column' minHeight='100vh'>
      <MainHeader />
      <Box maxWidth='760px' mx='auto' my={4} px={4} flex={1} w='full'>
        <BalanceInsufficientAlert />
        <VStack spacing={8} align='stretch'>
          <RemarkTransactionExample />
          <Divider />
          <TransferKeepAliveExample />
        </VStack>
      </Box>
      <MainFooter />
    </Flex>
  );
}

export default App;
