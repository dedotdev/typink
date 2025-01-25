import { Box, Container, Flex, Image } from '@chakra-ui/react';
import React from 'react';
import AccountSelection from '@/components/shared/AccountSelection.tsx';
import NetworkSelection from '@/components/shared/NetworkSelection.tsx';
import WalletSelection from '@/components/shared/WalletSelection.tsx';
import { useTypink } from 'typink';

export default function MainHeader() {
  const { signer } = useTypink();

  return (
    <Box borderBottom={1} borderStyle='solid' borderColor='gray.200'>
      <Container
        maxWidth='container.lg'
        px={4}
        mx='auto'
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        gap={4}
        h={16}>
        <a href='/'>
          <Box>
            <Image h={6} src='/typink-logo.png' />
          </Box>
        </a>
        <Flex gap={2}>
          <NetworkSelection />
          {signer ? <AccountSelection /> : <WalletSelection />}
        </Flex>
      </Container>
    </Box>
  );
}
