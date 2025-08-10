import { Flex, Text } from '@chakra-ui/react';
import { useTypink } from 'typink';

export default function ConnectedWallet() {
  const { connectedWallet } = useTypink();

  return (
    <Flex align='center' gap={3} flex={1} justify='center' pb={2}>
      <img src={connectedWallet?.logo} alt={connectedWallet?.name} width={24} />
      <Text fontWeight='600' fontSize='14'>
        {connectedWallet?.name} - v{connectedWallet?.version}
      </Text>
    </Flex>
  );
}
