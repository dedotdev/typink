import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  VStack,
  HStack,
  Text,
  Badge,
  useDisclosure,
  useMediaQuery,
  Card,
  CardBody,
  Avatar,
} from '@chakra-ui/react';
import { useTypink, NetworkInfo } from 'typink';
import { useMemo, useState } from 'react';

interface NetworkGroup {
  id: string;
  name: string;
  description: string;
  primary: NetworkInfo;
  secondary: NetworkInfo[];
  ecosystem: string;
}

function NetworkStatusIndicator() {
  const { clients, networks } = useTypink();

  // Calculate overall status
  const allNetworkIds = networks.map((n) => n.id);
  const readyCount = allNetworkIds.filter((id) => {
    return clients.has(id);
  }).length;

  const totalNetworks = allNetworkIds.length;

  if (readyCount === 0) {
    return <Spinner size='xs' />;
  } else if (readyCount === totalNetworks) {
    return (
      <HStack spacing={1}>
        <Box borderRadius='50%' width={3} height={3} backgroundColor='green.500' />
        {totalNetworks > 1 && (
          <Text fontSize='xs' color='green.600' fontWeight='medium'>
            {totalNetworks}
          </Text>
        )}
      </HStack>
    );
  } else {
    return (
      <HStack spacing={1}>
        <Box borderRadius='50%' width={3} height={3} backgroundColor='yellow.500' />
        <Text fontSize='xs' color='yellow.600' fontWeight='medium'>
          {readyCount}/{totalNetworks}
        </Text>
      </HStack>
    );
  }
}

interface NetworkGroupCardProps {
  group: NetworkGroup;
  isConnected: boolean;
  onConnect: (group: NetworkGroup) => void;
  isConnecting: boolean;
}

function NetworkGroupCard({ group, isConnected, onConnect, isConnecting }: NetworkGroupCardProps) {
  return (
    <Card
      bg={isConnected ? 'green.50' : 'white'}
      borderColor={isConnected ? 'green.200' : 'gray.200'}
      borderWidth={1}
      _hover={{
        borderColor: isConnected ? 'green.300' : 'gray.300',
        boxShadow: 'sm',
      }}
      transition='all 0.2s'>
      <CardBody p={4}>
        <HStack justify='space-between' align='center' spacing={4}>
          {/* Left side - Ecosystem info */}
          <HStack spacing={3} flex={1}>
            <Avatar size='md' src={group.primary.logo} name={group.primary.name} />
            <VStack spacing={1} align='start'>
              <HStack spacing={2} align='center'>
                <Text fontSize='md' fontWeight='bold' color='gray.900'>
                  {group.ecosystem}
                </Text>
                {isConnected && (
                  <Badge colorScheme='green' variant='solid' size='sm'>
                    Connected
                  </Badge>
                )}
              </HStack>
              <Text fontSize='sm' color='gray.600'>
                {group.primary.name}, {group.secondary.map((n) => n.name).join(', ')}
              </Text>
            </VStack>
          </HStack>

          {/* Right side - Connect button */}
          <Button
            colorScheme={isConnected ? 'green' : 'blue'}
            variant={isConnected ? 'outline' : 'solid'}
            size='sm'
            onClick={() => onConnect(group)}
            isLoading={isConnecting}
            loadingText='Connecting...'>
            {isConnected ? 'Connected' : 'Connect'}
          </Button>
        </HStack>
      </CardBody>
    </Card>
  );
}

export default function NetworkGroupSelector() {
  const { network, setNetworks, supportedNetworks } = useTypink();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const [connectingGroupId, setConnectingGroupId] = useState<string | null>(null);

  // Define the network groups
  const networkGroups = useMemo((): NetworkGroup[] => {
    const findNetwork = (id: string) => supportedNetworks.find((n) => n.id === id);

    const polkadot = findNetwork('polkadot');
    const polkadotAssetHub = findNetwork('polkadot_asset_hub');
    const polkadotPeople = findNetwork('polkadot_people');

    const kusama = findNetwork('kusama');
    const kusamaAssetHub = findNetwork('kusama_asset_hub');
    const kusamaPeople = findNetwork('kusama_people');

    const paseo = findNetwork('paseo');
    const paseoAssetHub = findNetwork('paseo_asset_hub');
    const paseoPeople = findNetwork('paseo_people');

    const groups: NetworkGroup[] = [];

    if (polkadot && polkadotAssetHub && polkadotPeople) {
      groups.push({
        id: 'polkadot-ecosystem',
        name: 'Polkadot Ecosystem',
        description: 'Polkadot relay chain with Asset Hub and People chain',
        primary: polkadot,
        secondary: [polkadotAssetHub, polkadotPeople],
        ecosystem: 'Polkadot',
      });
    }

    if (kusama && kusamaAssetHub && kusamaPeople) {
      groups.push({
        id: 'kusama-ecosystem',
        name: 'Kusama Ecosystem',
        description: 'Kusama relay chain with Asset Hub and People chain',
        primary: kusama,
        secondary: [kusamaAssetHub, kusamaPeople],
        ecosystem: 'Kusama',
      });
    }

    if (paseo && paseoAssetHub && paseoPeople) {
      groups.push({
        id: 'paseo-ecosystem',
        name: 'Paseo Ecosystem',
        description: 'Paseo testnet with Asset Hub and People chain',
        primary: paseo,
        secondary: [paseoAssetHub, paseoPeople],
        ecosystem: 'Paseo',
      });
    }

    return groups;
  }, [supportedNetworks]);

  // Determine current group based on connected network
  const currentGroup = useMemo(() => {
    return networkGroups.find((group) => group.primary.id === network.id);
  }, [networkGroups, network.id]);

  const handleConnect = async (group: NetworkGroup) => {
    setConnectingGroupId(group.id);
    try {
      // Set all networks at once (primary first, then secondary)
      const allNetworkIds = [group.primary.id, ...group.secondary.map((n) => n.id)];
      setNetworks(allNetworkIds);

      onClose();
    } catch (error) {
      console.error('Failed to connect to network group:', error);
    } finally {
      setConnectingGroupId(null);
    }
  };

  const handleClose = () => {
    onClose();
    setConnectingGroupId(null);
  };

  // If no groups are available, return a simple network display
  if (networkGroups.length === 0) {
    return (
      <Button variant='outline' disabled>
        <Flex direction='row' align='center' gap={2}>
          <img src={network.logo} alt={network.name} width={22} style={{ borderRadius: 4 }} />
          <span>{network.name}</span>
          <Box ml={2}>
            <NetworkStatusIndicator />
          </Box>
        </Flex>
      </Button>
    );
  }

  return (
    <>
      <Button variant='outline' onClick={onOpen}>
        <Flex direction='row' align='center' gap={2}>
          <img src={network.logo} alt={network.name} width={22} style={{ borderRadius: 4 }} />
          <span>{currentGroup ? currentGroup.ecosystem : network.name}</span>
          <Box ml={2}>
            <NetworkStatusIndicator />
          </Box>
        </Flex>
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} size={isMobile ? 'full' : '4xl'}>
        <ModalOverlay />
        <ModalContent maxH={isMobile ? '100vh' : '85vh'}>
          <ModalHeader>Select Network Ecosystem</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align='stretch'>
              {networkGroups.map((group) => (
                <NetworkGroupCard
                  key={group.id}
                  group={group}
                  isConnected={currentGroup?.id === group.id}
                  onConnect={handleConnect}
                  isConnecting={connectingGroupId === group.id}
                />
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
