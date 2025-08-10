import { Box, Container, Flex } from '@chakra-ui/react';
import AccountSelection from '@/components/AccountSelection.tsx';
import WalletSelection from '@/components/dialog/WalletSelection.tsx';
import { useTypink } from 'typink';

export default function MainHeader() {
  const { signer } = useTypink();

  return (
    <Box borderBottom={1} borderStyle='solid' borderColor='gray.200'>
      <Container
        maxWidth='760px'
        px={4}
        mx='auto'
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        gap={4}
        h={16}>
        <a href='/ui/public'>
          <Box w={8}>
            <img src='/typink-logo.png' />
          </Box>
        </a>
        <Flex gap={2}>{signer ? <AccountSelection /> : <WalletSelection />}</Flex>
      </Container>
    </Box>
  );
}
