import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Link,
  HStack,
  VStack,
  Avatar,
  Text,
  Wrap,
  WrapItem,
  Badge,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useBalance, useTypink } from 'typink';
import { useMemo } from 'react';

const DEFAULT_FAUCET_URL = 'https://github.com/use-ink/contracts-ui/blob/master/FAUCETS.md';

function NetworkInsufficientCard({ network }: { network: any }) {
  return (
    <WrapItem>
      <HStack spacing={2} bg='orange.50' px={3} py={1} borderRadius='md' border='1px solid' borderColor='orange.200'>
        <Avatar size='xs' src={network.logo} name={network.name} />
        <Text fontSize='sm' fontWeight='medium'>
          {network.name}
        </Text>
        <Badge size='sm' colorScheme='orange' variant='subtle'>
          {network.symbol}
        </Badge>
      </HStack>
    </WrapItem>
  );
}

export default function BalanceInsufficientAlert() {
  const { ready, networks, connectedAccount } = useTypink();

  // Get first 3 networks from the networks array
  const firstThreeNetworks = useMemo(() => networks.slice(0, 3), [networks]);

  // Get balances for each of the first 3 networks directly
  const network1Balance = useBalance(connectedAccount?.address, { networkId: firstThreeNetworks[0]?.id });
  const network2Balance = useBalance(connectedAccount?.address, { networkId: firstThreeNetworks[1]?.id });
  const network3Balance = useBalance(connectedAccount?.address, { networkId: firstThreeNetworks[2]?.id });

  // Find networks with insufficient balances
  const insufficientNetworks = useMemo(() => {
    const networkBalances = [
      { network: firstThreeNetworks[0], balance: network1Balance },
      { network: firstThreeNetworks[1], balance: network2Balance },
      { network: firstThreeNetworks[2], balance: network3Balance },
    ];

    return networkBalances
      .filter(({ network, balance }) => network && balance !== undefined && balance.free === 0n)
      .map(({ network }) => network);
  }, [firstThreeNetworks, network1Balance, network2Balance, network3Balance]);

  // Only show alert when account is connected AND all networks are ready AND there are insufficient balances
  if (!connectedAccount || !ready || insufficientNetworks.length === 0 || firstThreeNetworks.length < 3) {
    return null;
  }

  // Get the primary faucet URL (prefer network-specific, fallback to default)
  const primaryFaucetUrl = insufficientNetworks[0]?.faucetUrl || DEFAULT_FAUCET_URL;

  return (
    <Alert status='warning' mb={4} borderRadius='md'>
      <AlertIcon />
      <Box flex={1}>
        <AlertTitle mb={2}>Balance insufficient for transactions</AlertTitle>
        <AlertDescription>
          <VStack spacing={3} align='start'>
            {/* Networks with insufficient balance */}
            <Box>
              <Text fontSize='sm' color='gray.700' mb={2}>
                Networks requiring tokens:
              </Text>
              <Wrap spacing={2}>
                {insufficientNetworks.map((network) => (
                  <NetworkInsufficientCard key={network.id} network={network} />
                ))}
              </Wrap>
            </Box>

            {/* Faucet link */}
            <Link
              href={primaryFaucetUrl}
              isExternal
              color='orange.600'
              fontWeight='medium'
              _hover={{ color: 'orange.700', textDecoration: 'underline' }}>
              Claim testnet tokens from faucet <ExternalLinkIcon mx='2px' />
            </Link>
          </VStack>
        </AlertDescription>
      </Box>
    </Alert>
  );
}
