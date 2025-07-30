import { Box, Container, Flex, Image, useColorMode } from '@chakra-ui/react';
import React from 'react';
import AccountSelection from '@/components/shared/AccountSelection.tsx';
import NetworkSelection from '@/components/shared/NetworkSelection.tsx';
import ThemeModeButton from '@/components/shared/ThemeModeButton.tsx';
import WalletSelection from '@/components/shared/WalletSelection.tsx';
import { useTypink } from 'typink';

export default function MainHeader() {
  const { signer } = useTypink();
  const { colorMode } = useColorMode();

  return (
    <Box borderBottom={1} borderStyle='solid' borderColor='var(--chakra-colors-chakra-border-color)'>
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
            <Image
              h={6}
              src={colorMode === 'light' ? '/typink-text-dark-logo.png' : '/typink-text-light-logo.png'}
              display={{ base: 'none', md: 'block' }}
            />
            <Image
              h={6}
              src={colorMode === 'light' ? '/typink-dark-logo.png' : '/typink-light-logo.png'}
              display={{ base: 'block', md: 'none' }}
            />
          </Box>
        </a>
        <Flex gap={2}>
          <ThemeModeButton />
          <NetworkSelection />
          {signer ? <AccountSelection /> : <WalletSelection />}
        </Flex>
      </Container>
    </Box>
  );
}
