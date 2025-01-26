import { Box, Flex } from '@chakra-ui/react';
import BalanceInsufficientAlert from '@/components/shared/BalanceInsufficientAlert.tsx';
import MainFooter from '@/components/shared/MainFooter';
import MainHeader from '@/components/shared/MainHeader';
import MainBoard from '@/components/MainBoard.tsx';

function App() {
  return (
    <Flex direction='column' minHeight='100vh'>
      <MainHeader />
      <Box maxWidth='container.lg' mx='auto' my={4} px={4} flex={1} w='full'>
        <BalanceInsufficientAlert />

        <Box mt={8} mx={{ base: 0, md: 32 }}>
          <MainBoard />
        </Box>
      </Box>
      <MainFooter />
    </Flex>
  );
}

export default App;
