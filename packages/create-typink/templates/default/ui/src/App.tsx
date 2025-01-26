import { Box, Flex } from '@chakra-ui/react';
import MainBoard from '@/components/MainBoard.tsx';
import BalanceInsufficientAlert from '@/components/shared/BalanceInsufficientAlert.tsx';
import MainFooter from '@/components/shared/MainFooter';
import MainHeader from '@/components/shared/MainHeader';
import TypinkIntroduction from '@/components/shared/TypinkIntroduction.tsx';

export default function App() {
  return (
    <Flex direction='column' minHeight='100vh'>
      <MainHeader />
      <Box maxWidth='container.lg' mx='auto' my={12} px={4} flex={1} w='full'>
        <TypinkIntroduction />

        <Box mt={8} mx={{ base: 0, md: 32 }}>
          <BalanceInsufficientAlert />
          <MainBoard />
        </Box>
      </Box>
      <MainFooter />
    </Flex>
  );
}
