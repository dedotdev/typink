import { Box, Container, Flex } from '@chakra-ui/react';
import AccountManager from '@/components/AccountManager.tsx';

export default function MainHeader() {
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
          <Box w={8}>
            <img src='/typink-logo.png' />
          </Box>
        </a>
        <Flex gap={2}>
          <AccountManager />
        </Flex>
      </Container>
    </Box>
  );
}
