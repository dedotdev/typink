import {
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  Avatar,
  Spinner,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';
import { useTypink, NetworkInfo, ClientConnectionStatus, NetworkConnection } from 'typink';
import { useMemo } from 'react';

interface NetworkStatus {
  network: NetworkInfo;
  connection: NetworkConnection;
  status: ClientConnectionStatus;
}

interface EcosystemGroup {
  name: string;
  id: string;
  networks: NetworkStatus[];
  primaryNetwork: NetworkInfo;
  readyCount: number;
  totalCount: number;
}

function ConnectionStatusIcon({ status }: { status: ClientConnectionStatus }) {
  switch (status) {
    case ClientConnectionStatus.Connected:
      return <CheckCircleIcon color='green.500' boxSize={5} />;
    case ClientConnectionStatus.Connecting:
      return <Spinner size='sm' color='orange.500' />;
    case ClientConnectionStatus.Error:
      return <WarningIcon color='red.500' boxSize={5} />;
    case ClientConnectionStatus.NotConnected:
    default:
      return <InfoIcon color='gray.400' boxSize={5} />;
  }
}

function NetworkCard({
  networkStatus,
  onRetry,
}: {
  networkStatus: NetworkStatus;
  onRetry: (networkId: string) => void;
}) {
  const { network, status } = networkStatus;
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue(
    status === ClientConnectionStatus.Connected
      ? 'green.200'
      : status === ClientConnectionStatus.Connecting
        ? 'orange.200'
        : status === ClientConnectionStatus.Error
          ? 'red.200'
          : 'gray.200',
    status === ClientConnectionStatus.Connected
      ? 'green.600'
      : status === ClientConnectionStatus.Connecting
        ? 'orange.600'
        : status === ClientConnectionStatus.Error
          ? 'red.600'
          : 'gray.600',
  );

  const getStatusColor = () => {
    switch (status) {
      case ClientConnectionStatus.Connected:
        return 'green';
      case ClientConnectionStatus.Connecting:
        return 'orange';
      case ClientConnectionStatus.Error:
        return 'red';
      case ClientConnectionStatus.NotConnected:
      default:
        return 'gray';
    }
  };

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
            <Avatar size='md' src={network.logo} name={network.name} />
            <VStack spacing={1} align='start'>
              <Text fontSize='md' fontWeight='semibold'>
                {network.name}
              </Text>
              <HStack spacing={2} align='center'>
                <Text fontSize='sm' color='gray.600'>
                  {network.symbol}
                </Text>
                <Badge
                  colorScheme={getStatusColor()}
                  variant={status === ClientConnectionStatus.Connected ? 'solid' : 'outline'}
                  size='sm'>
                  {status === ClientConnectionStatus.Connected
                    ? 'Connected'
                    : status === ClientConnectionStatus.Connecting
                      ? 'Connecting'
                      : status === ClientConnectionStatus.Error
                        ? 'Connection Failed'
                        : 'Not Connected'}
                </Badge>
              </HStack>
            </VStack>
          </HStack>

          {/* Right side - Status icon and actions */}
          <VStack spacing={2} align='center'>
            <ConnectionStatusIcon status={status} />
            {status === ClientConnectionStatus.Error && (
              <Button size='xs' colorScheme='red' variant='outline' onClick={() => onRetry(network.id)}>
                Retry
              </Button>
            )}
          </VStack>
        </HStack>
      </CardBody>
    </Card>
  );
}

function EcosystemSection({ ecosystem, onRetry }: { ecosystem: EcosystemGroup; onRetry: (networkId: string) => void }) {
  const readyPercentage =
    ecosystem.totalCount > 0 ? Math.round((ecosystem.readyCount / ecosystem.totalCount) * 100) : 0;

  return (
    <Card borderWidth={1} border='1px solid' borderColor='gray.200'>
      <CardBody p={4}>
        {/* Ecosystem Header */}
        <HStack justify='space-between' align='center' mb={4}>
          <HStack spacing={3}>
            <Avatar size='sm' src={ecosystem.primaryNetwork.logo} name={ecosystem.name} />
            <VStack spacing={0} align='start'>
              <Text fontSize='md' fontWeight='bold'>
                {ecosystem.name} Ecosystem
              </Text>
              <Text fontSize='sm' color='gray.600'>
                {ecosystem.totalCount} networks
              </Text>
            </VStack>
          </HStack>
          <Badge
            colorScheme={readyPercentage === 100 ? 'green' : readyPercentage > 0 ? 'yellow' : 'red'}
            variant='solid'>
            {ecosystem.readyCount}/{ecosystem.totalCount} Ready
          </Badge>
        </HStack>

        {/* Network Cards - Each on separate row */}
        <VStack spacing={3} align='stretch'>
          {ecosystem.networks.map((networkStatus) => (
            <NetworkCard key={networkStatus.network.id} networkStatus={networkStatus} onRetry={onRetry} />
          ))}
        </VStack>
      </CardBody>
    </Card>
  );
}

export default function NetworkStatusDashboard() {
  const { networks, clients, connectionStatus, setNetworks, networkConnections } = useTypink();

  // Handle retry for failed connections
  const handleRetry = (networkId: string) => {
    // Re-initialize the network connection by updating the connections list
    // This will trigger the client to reconnect
    const currentConnection = networkConnections.find((conn) => conn.networkId === networkId);
    if (currentConnection) {
      // Trigger reconnection by updating the networks list
      setNetworks(networkConnections);
    }
  };

  // Process networks into ecosystems and status
  const ecosystems = useMemo((): EcosystemGroup[] => {
    const networkStatuses: NetworkStatus[] = networks.map((network) => {
      // Get real connection status from the connectionStatus Map
      const status = connectionStatus.get(network.id) || ClientConnectionStatus.NotConnected;

      // Find the corresponding network connection
      const connection = networkConnections.find((conn) => conn.networkId === network.id) || { networkId: network.id };

      return {
        network,
        connection,
        status,
      };
    });

    // Group by ecosystem
    const ecosystemMap = new Map<string, NetworkStatus[]>();

    networkStatuses.forEach((networkStatus) => {
      const network = networkStatus.network;
      let ecosystemKey = 'Other';

      // Determine ecosystem based on network ID patterns
      if (network.id.includes('polkadot')) {
        ecosystemKey = 'Polkadot';
      } else if (network.id.includes('kusama')) {
        ecosystemKey = 'Kusama';
      } else if (network.id.includes('paseo')) {
        ecosystemKey = 'Paseo';
      } else if (network.id.includes('westend')) {
        ecosystemKey = 'Westend';
      }

      if (!ecosystemMap.has(ecosystemKey)) {
        ecosystemMap.set(ecosystemKey, []);
      }
      ecosystemMap.get(ecosystemKey)!.push(networkStatus);
    });

    // Convert to ecosystem groups
    return Array.from(ecosystemMap.entries())
      .map(([name, networks]) => {
        // Find primary network (relay chain)
        const primaryNetwork =
          networks.find(
            (n) =>
              !n.network.id.includes('asset') && !n.network.id.includes('people') && !n.network.id.includes('bridge'),
          )?.network || networks[0].network;

        const readyCount = networks.filter((n) => n.status === ClientConnectionStatus.Connected).length;

        return {
          name,
          id: name.toLowerCase(),
          networks,
          primaryNetwork,
          readyCount,
          totalCount: networks.length,
        };
      })
      .sort((a, b) => {
        // Sort: Polkadot, Kusama, others
        const order = ['polkadot', 'kusama', 'paseo', 'westend'];
        const aIndex = order.indexOf(a.id);
        const bIndex = order.indexOf(b.id);

        if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
  }, [networks, clients, connectionStatus, networkConnections]);

  if (networks.length === 0) {
    return (
      <Card>
        <CardBody p={8}>
          <VStack spacing={4}>
            <InfoIcon boxSize={12} color='gray.200' />
            <Text fontSize='lg' color='gray.600' textAlign='center'>
              No networks configured
            </Text>
            <Text fontSize='sm' color='gray.500' textAlign='center'>
              Configure networks in your TypinkProvider to see connection status
            </Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={4} align='stretch'>
      {/* Ecosystem Sections */}
      {ecosystems.map((ecosystem) => (
        <EcosystemSection key={ecosystem.id} ecosystem={ecosystem} onRetry={handleRetry} />
      ))}
    </VStack>
  );
}
