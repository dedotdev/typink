import { Box, Button, Divider, Flex, Heading, Image, Link, List, ListIcon, ListItem, Text } from '@chakra-ui/react';
import { GithubSvgIcon } from '@/components/shared/icons.tsx';

export default function TypinkIntroduction() {
  return (
    <Box mx={{ base: 0, md: 32 }}>
      <Image my={4} mx='auto' src='./typink-pink.svg' width='12rem' />
      <Text fontSize='lg' textAlign='center'>
        Typesafe React hooks for seamless{' '}
        <Link color='primary.500' href='https://use.ink' target='_blank'>
          ink! smart contract
        </Link>{' '}
        interactions, powered by{' '}
        <Link color='primary.500' href='https://dedot.dev' target='_blank'>
          Dedot!
        </Link>
      </Text>

      <Flex mt={4} justifyContent='center' gap={2}>
        <Button
          colorScheme='primary'
          variant='outline'
          leftIcon={<>🚀</>}
          as={'a'}
          href='https://github.com/dedotdev/typink?tab=readme-ov-file#getting-started'
          target='_blank'>
          Getting Started
        </Button>
        <Button
          variant='outline'
          leftIcon={<GithubSvgIcon width='16' />}
          as={'a'}
          href='https://github.com/dedotdev/typink'
          target='_blank'>
          Github
        </Button>
      </Flex>
      <Divider my={8} />
    </Box>
  );
}
