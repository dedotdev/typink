import { Box, Flex, Image, Link, Text } from '@chakra-ui/react';
import React from 'react';
import { GithubSvgIcon, XSvgIcon } from '@/components/shared/icons.tsx';

export default function MainFooter() {
  return (
    <Box borderTop={1} borderStyle='solid' borderColor='var(--chakra-colors-chakra-border-color)'>
      <Flex
        maxWidth='container.lg'
        px={4}
        mx='auto'
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        gap={4}
        py={4}>
        <Box>
          <Text>
            Made by{' '}
            <Link href='https://dedot.dev' target='_blank'>
              dedot.dev
            </Link>
          </Text>
        </Box>
        <Flex gap={6}>
          <a href='https://twitter.com/realsinzii' target='_blank'>
            <XSvgIcon />
          </a>
          <a href='https://github.com/dedotdev/typink-dapp-template' target='_blank'>
            <GithubSvgIcon />
          </a>
          <a href='https://dedot.dev' target='_blank'>
            <Image width={25} src='/dedot-dark-logo.png' />
          </a>
        </Flex>
      </Flex>
    </Box>
  );
}
