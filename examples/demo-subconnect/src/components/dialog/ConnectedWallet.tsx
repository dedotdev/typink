import { Box, Flex, Text } from '@chakra-ui/react';
import { useConnectWallet } from '@subwallet-connect/react';

export default function ConnectedWallet() {
  const [{ wallet }] = useConnectWallet();

  if (!wallet) return null;

  return (
    <Flex align='center' gap={3} flex={1} justify='center' pb={2}>
      <Box dangerouslySetInnerHTML={{ __html: wallet.icon }} width='24px' />
      <Text fontWeight='600' fontSize='14'>
        {wallet.label}
      </Text>
    </Flex>
  );
}
