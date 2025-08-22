import {
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Spinner,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import { useBalance, useTypink, formatBalance } from 'typink';
import { useMemo } from 'react';

function NetworkBalanceCard({ network, address }: { network: any; address: string }) {
  const balance = useBalance(address, { networkId: network.id });
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Card
      bg={bgColor}
      borderWidth={1}
      borderColor={borderColor}
      _hover={{
        transform: 'translateY(-1px)',
        boxShadow: 'md',
      }}
      transition='all 0.2s'>
      <CardBody p={4}>
        <HStack justify='space-between' align='center' spacing={4}>
          {/* Left side - Network info */}
          <HStack spacing={3} flex={1}>
            <Avatar size='sm' src={network.logo} name={network.name} />
            <VStack spacing={0} align='start'>
              <Text fontSize='md' fontWeight='semibold'>
                {network.name}
              </Text>
              <Text fontSize='sm' color='gray.600'>
                {network.symbol}
              </Text>
            </VStack>
          </HStack>

          {/* Right side - Balance */}
          <Box textAlign='right'>
            {balance === undefined ? (
              <Spinner size='sm' />
            ) : (
              <VStack spacing={0} align='end'>
                <Text fontSize='lg' fontWeight='bold'>
                  {formatBalance(balance.free, network)}
                </Text>
                <Text fontSize='xs' color='gray.500'>
                  Free Balance
                </Text>
              </VStack>
            )}
          </Box>
        </HStack>
      </CardBody>
    </Card>
  );
}

export default function MultiNetworkBalanceDashboard() {
  const { networks, connectedAccount, clients } = useTypink();

  // Get connected networks
  const connectedNetworks = useMemo(() => 
    networks.filter(network => clients.has(network.id)), 
    [networks, clients]
  );

  if (!connectedAccount || connectedNetworks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <Text fontSize='lg' fontWeight='bold'>
            Account Balances
          </Text>
        </CardHeader>
        <CardBody>
          <Text color='gray.500' textAlign='center'>
            {!connectedAccount ? 'No account connected' : 'No networks connected'}
          </Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <VStack spacing={1} align='start'>
          <Text fontSize='lg' fontWeight='bold'>
            Account Balances
          </Text>
          <Text fontSize='sm' color='gray.600'>
            {connectedAccount.name} ({connectedAccount.address.slice(0, 8)}...{connectedAccount.address.slice(-8)})
          </Text>
        </VStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={3} align='stretch'>
          {connectedNetworks.map(network => (
            <NetworkBalanceCard
              key={network.id}
              network={network}
              address={connectedAccount.address}
            />
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
}