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
  SimpleGrid,
  Avatar,
  AvatarGroup,
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
  const { clientReadyStates, networks } = useTypink();

  // Calculate overall status
  const allNetworkIds = networks.map((n) => n.id);
  const readyCount = allNetworkIds.filter((id) => {
    return clientReadyStates.get(id) === true;
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
  isSelected: boolean;
  isConnected: boolean;
  onSelect: (groupId: string) => void;
}

function NetworkGroupCard({ group, isSelected, isConnected, onSelect }: NetworkGroupCardProps) {
  return (
    <Card
      cursor='pointer'
      onClick={() => onSelect(group.id)}
      bg={isConnected ? 'green.50' : isSelected ? 'blue.50' : 'white'}
      borderColor={isConnected ? 'green.200' : isSelected ? 'blue.200' : 'gray.200'}
      borderWidth={isConnected || isSelected ? 2 : 1}
      _hover={{
        bg: isConnected ? 'green.100' : isSelected ? 'blue.100' : 'gray.50',
        borderColor: isConnected ? 'green.300' : isSelected ? 'blue.300' : 'gray.300',
        transform: 'translateY(-2px)',
        boxShadow: 'md',
      }}
      transition='all 0.2s'
      height='200px'>
      <CardBody p={6}>
        <VStack spacing={4} align='stretch' height='full'>
          {/* Header with ecosystem name and status */}
          <HStack justify='space-between' align='center'>
            <Text fontSize='lg' fontWeight='bold' color='gray.900'>
              {group.ecosystem}
            </Text>
            {isConnected && (
              <Badge colorScheme='green' variant='solid'>
                Connected
              </Badge>
            )}
          </HStack>

          {/* Primary network display */}
          <VStack spacing={3} flex={1}>
            <HStack spacing={3} width='full' align='center'>
              <Avatar size='sm' src={group.primary.logo} name={group.primary.name} />
              <VStack spacing={0} align='start' flex={1}>
                <Text fontSize='sm' fontWeight='semibold'>
                  {group.primary.name}
                </Text>
                <Text fontSize='xs' color='gray.600'>
                  Primary • {group.primary.symbol}
                </Text>
              </VStack>
            </HStack>

            {/* Secondary networks */}
            <VStack spacing={2} width='full' align='start'>
              <Text fontSize='xs' color='gray.500' fontWeight='medium'>
                Secondary Networks:
              </Text>
              <HStack spacing={2} flexWrap='wrap'>
                <AvatarGroup size='xs' max={3}>
                  {group.secondary.map((network) => (
                    <Avatar key={network.id} src={network.logo} name={network.name} title={network.name} />
                  ))}
                </AvatarGroup>
                <Text fontSize='xs' color='gray.600'>
                  {group.secondary.map((n) => n.name).join(', ')}
                </Text>
              </HStack>
            </VStack>
          </VStack>

          {/* Total networks count */}
          <HStack justify='space-between' align='center' pt={2}>
            <Text fontSize='xs' color='gray.500'>
              {1 + group.secondary.length} networks total
            </Text>
            {(isSelected || isConnected) && (
              <Box color={isConnected ? 'green.500' : 'blue.500'}>
                <Text fontSize='sm'>✓</Text>
              </Box>
            )}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
}

export default function NetworkGroupSelector() {
  const { network, setNetworks, supportedNetworks } = useTypink();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

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

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  const handleConnect = async () => {
    if (!selectedGroupId) return;

    const selectedGroup = networkGroups.find((g) => g.id === selectedGroupId);
    if (!selectedGroup) return;

    setIsConnecting(true);
    try {
      // Set all networks at once (primary first, then secondary)
      const allNetworkIds = [selectedGroup.primary.id, ...selectedGroup.secondary.map((n) => n.id)];
      setNetworks(allNetworkIds);

      onClose();
      setSelectedGroupId(null);
    } catch (error) {
      console.error('Failed to connect to network group:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpen = () => {
    // Initialize with current group if available
    if (currentGroup) {
      setSelectedGroupId(currentGroup.id);
    }
    onOpen();
  };

  const handleClose = () => {
    onClose();
    setSelectedGroupId(null);
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
      <Button variant='outline' onClick={handleOpen}>
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
            <VStack spacing={6} align='stretch'>
              <Text color='gray.600' fontSize='sm' textAlign='center'>
                Choose an ecosystem to connect to multiple related networks simultaneously. The first network becomes
                your primary connection, others are secondary.
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {networkGroups.map((group) => (
                  <NetworkGroupCard
                    key={group.id}
                    group={group}
                    isSelected={selectedGroupId === group.id}
                    isConnected={currentGroup?.id === group.id}
                    onSelect={handleGroupSelect}
                  />
                ))}
              </SimpleGrid>

              {selectedGroupId && (
                <Box borderWidth={1} borderColor='blue.200' borderRadius='lg' p={4} bg='blue.50'>
                  <VStack spacing={3} align='center'>
                    <Text fontSize='sm' color='blue.800' fontWeight='medium'>
                      Ready to connect to {networkGroups.find((g) => g.id === selectedGroupId)?.ecosystem} ecosystem
                    </Text>
                    <Button
                      colorScheme='blue'
                      onClick={handleConnect}
                      isLoading={isConnecting}
                      loadingText='Connecting...'
                      size='md'>
                      Connect to Ecosystem
                    </Button>
                  </VStack>
                </Box>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
