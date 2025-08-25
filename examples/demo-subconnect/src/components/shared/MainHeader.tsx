import { Box, Container, Flex } from '@chakra-ui/react';
import { useConnectWallet } from '@subwallet-connect/react';
import AccountSelection from '@/components/AccountSelection.tsx';
import { ConnectWalletButton } from '@/components/shared/ConnectWalletButton.tsx';

export default function MainHeader() {
  const [{ wallet }] = useConnectWallet();

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
        <a href='/'>
          <Box w={9}>
            <img src='/typink-logo.png' />
          </Box>
        </a>
        <Flex gap={2}>{wallet ? <AccountSelection /> : <ConnectWalletButton />}</Flex>
      </Container>
    </Box>
  );
}
