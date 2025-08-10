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
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
  useMediaQuery,
  VStack,
  HStack,
  Text,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  Grid,
  GridItem,
  ModalFooter,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useTypink, NetworkInfo, NetworkType } from 'typink';
import { useMemo, useState } from 'react';

function NetworkStatusIndicator() {
  const { ready } = useTypink();

  if (ready) {
    return <Box borderRadius='50%' width={3} height={3} backgroundColor='green.500' />;
  } else {
    return <Spinner size='xs' />;
  }
}

interface NetworkItemProps {
  network: NetworkInfo;
  currentNetworkId: string;
  selectedNetworkId?: string;
  onSelect: (networkId: string) => void;
}

function NetworkItem({ network, currentNetworkId, selectedNetworkId, onSelect }: NetworkItemProps) {
  const isConnected = network.id === currentNetworkId;
  const isSelected = network.id === selectedNetworkId;

  return (
    <Button
      onClick={() => onSelect(network.id)}
      variant='ghost'
      justifyContent='flex-start'
      height='auto'
      py={3}
      px={4}
      width='full'
      bg={isConnected ? 'green.50' : isSelected ? 'blue.50' : 'transparent'}
      borderColor={isConnected ? 'green.200' : isSelected ? 'blue.200' : 'transparent'}
      borderWidth={1}
      _hover={{
        bg: isConnected ? 'green.100' : isSelected ? 'blue.100' : 'gray.50',
      }}>
      <HStack spacing={3} width='full'>
        <img src={network.logo} alt={network.name} width={24} height={24} style={{ borderRadius: 6, flexShrink: 0 }} />
        <VStack spacing={0} align='flex-start' flex={1}>
          <HStack spacing={2}>
            <Text fontSize='sm' fontWeight='medium' color='gray.900'>
              {network.name}
            </Text>
            {isConnected && (
              <Badge size='sm' colorScheme='green' variant='solid'>
                Connected
              </Badge>
            )}
          </HStack>
          <Text fontSize='xs' color='gray.600'>
            {network.symbol}
          </Text>
        </VStack>
        {network.type && (
          <Badge
            size='sm'
            colorScheme={
              network.type === NetworkType.MAINNET
                ? 'green'
                : network.type === NetworkType.TESTNET
                  ? 'yellow'
                  : 'purple'
            }
            variant='subtle'>
            {network.type}
          </Badge>
        )}
      </HStack>
    </Button>
  );
}

interface NetworkDetailsProps {
  network: NetworkInfo;
  selectedEndpoint: string;
  onEndpointChange: (endpoint: string) => void;
}

function NetworkDetails({ network, selectedEndpoint, onEndpointChange }: NetworkDetailsProps) {
  return (
    <Flex direction='column' h='full'>
      {/* Fixed Header Section */}
      <VStack spacing={3} align='center' pb={4} flexShrink={0}>
        <Box w='60px' h='60px' flexShrink={0}>
          <img 
            src={network.logo} 
            alt={network.name} 
            width={60} 
            height={60} 
            style={{ borderRadius: 8, objectFit: 'contain' }} 
          />
        </Box>
        <VStack spacing={1}>
          <Text fontSize='lg' fontWeight='bold' textAlign='center'>
            {network.name}
          </Text>
          <HStack spacing={2}>
            <Text fontSize='sm' color='gray.600'>
              {network.symbol}
            </Text>
            {network.type && (
              <Badge
                size='sm'
                colorScheme={
                  network.type === NetworkType.MAINNET
                    ? 'green'
                    : network.type === NetworkType.TESTNET
                      ? 'yellow'
                      : 'purple'
                }
                variant='subtle'>
                {network.type}
              </Badge>
            )}
          </HStack>
        </VStack>
      </VStack>

      <Divider mb={4} />

      {/* Scrollable Endpoints Section */}
      <VStack spacing={3} align='stretch' flex={1} overflow='hidden'>
        <HStack justify='space-between' flexShrink={0}>
          <Text fontSize='sm' fontWeight='semibold' color='gray.700'>
            Select Endpoint
          </Text>
          <Badge colorScheme='gray' variant='outline'>
            {network.providers.length} available
          </Badge>
        </HStack>
        
        <VStack 
          spacing={2} 
          align='stretch'
          flex={1}
          overflowY='auto'
          overflowX='hidden'
          pr={2}
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '2px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '2px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#a8a8a8',
            },
          }}
        >
          {network.providers.map((provider) => (
            <Button
              key={provider}
              onClick={() => onEndpointChange(provider)}
              variant='outline'
              size='sm'
              justifyContent='flex-start'
              alignItems='center'
              py={3}
              px={3}
              h='auto'
              w='full'
              bg={selectedEndpoint === provider ? 'blue.50' : 'white'}
              borderColor={selectedEndpoint === provider ? 'blue.400' : 'gray.200'}
              borderWidth={selectedEndpoint === provider ? 2 : 1}
              _hover={{
                bg: selectedEndpoint === provider ? 'blue.100' : 'gray.50',
                borderColor: selectedEndpoint === provider ? 'blue.400' : 'gray.300',
              }}
              position='relative'
            >
              <Box flex={1} minW={0} mr={2}>
                <Text 
                  fontSize='xs' 
                  fontFamily='mono' 
                  color={selectedEndpoint === provider ? 'blue.700' : 'gray.700'}
                  textAlign='left'
                  noOfLines={1}
                  title={provider}
                >
                  {provider}
                </Text>
              </Box>
              {selectedEndpoint === provider && (
                <Box 
                  position='absolute' 
                  right={2} 
                  color='blue.500'
                >
                  <Text fontSize='sm'>✓</Text>
                </Box>
              )}
            </Button>
          ))}
        </VStack>
      </VStack>
    </Flex>
  );
}

export default function NetworkSelection() {
  const { network, setNetworkId, supportedNetworks } = useTypink();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [smallest] = useMediaQuery('(max-width: 325px)');
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);

  const networksByType = useMemo(() => {
    const networks = Object.values(supportedNetworks);

    return {
      all: networks,
      mainnet: networks.filter((n) => n.type === NetworkType.MAINNET || !n.type),
      testnet: networks.filter((n) => n.type === NetworkType.TESTNET),
      devnet: networks.filter((n) => n.type === NetworkType.DEVNET),
    };
  }, [supportedNetworks]);

  const filteredNetworksByType = useMemo(() => {
    const filterNetworks = (networks: NetworkInfo[], query: string) => {
      if (!query) return networks;
      return networks.filter(
        (network) =>
          network.name.toLowerCase().includes(query.toLowerCase()) ||
          network.symbol.toLowerCase().includes(query.toLowerCase()),
      );
    };

    return {
      all: filterNetworks(networksByType.all, searchQueries[0] || ''),
      mainnet: filterNetworks(networksByType.mainnet, searchQueries[1] || ''),
      testnet: filterNetworks(networksByType.testnet, searchQueries[2] || ''),
      devnet: filterNetworks(networksByType.devnet, searchQueries[3] || ''),
    };
  }, [networksByType, searchQueries]);

  const tabs = [
    { label: 'All', networks: filteredNetworksByType.all },
    { label: 'Mainnet', networks: filteredNetworksByType.mainnet },
    { label: 'Testnet', networks: filteredNetworksByType.testnet },
    { label: 'Devnet', networks: filteredNetworksByType.devnet },
  ];

  const selectedNetwork = selectedNetworkId
    ? Object.values(supportedNetworks).find((n) => n.id === selectedNetworkId)
    : network; // Default to current network

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkId(networkId);
    const networkInfo = Object.values(supportedNetworks).find((n) => n.id === networkId);
    if (networkInfo && networkInfo.providers.length > 0) {
      setSelectedEndpoint(networkInfo.providers[0]);
    }
  };

  const handleConnect = async () => {
    if (!selectedNetworkId || !selectedEndpoint) return;

    setIsConnecting(true);
    try {
      // TODO: Add endpoint selection support to typink
      setNetworkId(selectedNetworkId);
      onClose();
      setSelectedNetworkId(null);
      setSelectedEndpoint('');
    } catch (error) {
      console.error('Failed to connect to network:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSearchChange = (tabIndex: number, query: string) => {
    setSearchQueries((prev) => ({ ...prev, [tabIndex]: query }));
  };

  const handleOpen = () => {
    // Initialize with current network
    setSelectedNetworkId(network.id);
    if (network.providers.length > 0) {
      setSelectedEndpoint(network.providers[0]);
    }
    onOpen();
  };

  const handleClose = () => {
    onClose();
    setSelectedNetworkId(null);
    setSelectedEndpoint('');
    setSearchQueries({});
  };

  return (
    <>
      <Button variant='outline' onClick={handleOpen}>
        <Flex direction='row' align='center' gap={2}>
          <img src={network.logo} alt={network.name} width={22} style={{ borderRadius: 4 }} />
          {!smallest && <span>{network.name}</span>}
          <Box ml={2}>
            <NetworkStatusIndicator />
          </Box>
        </Flex>
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} size={isMobile ? 'full' : '4xl'}>
        <ModalOverlay />
        <ModalContent maxH={isMobile ? '100vh' : '85vh'}>
          <ModalHeader>Select Network</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={0} overflow='hidden'>
            <Grid 
              templateColumns={isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)'} 
              gap={6} 
              h={isMobile ? 'auto' : 'auto'}
              w='full'
              overflow='hidden'>
              <GridItem display='flex' flexDirection='column' overflow='hidden' minW={0}>
                <Tabs
                  index={tabIndex}
                  onChange={setTabIndex}
                  variant='enclosed'
                  colorScheme='blue'
                  display='flex'
                  flexDirection='column'>
                  <TabList flexShrink={0}>
                    {tabs.map((tab, index) => (
                      <Tab key={index} fontSize='sm'>
                        <HStack spacing={2}>
                          <Text>{tab.label}</Text>
                          <Badge size='sm' colorScheme='gray' variant='solid' borderRadius='full'>
                            {tab.networks.length}
                          </Badge>
                        </HStack>
                      </Tab>
                    ))}
                  </TabList>

                  <TabPanels flex={1} display='flex' flexDirection='column'>
                    {tabs.map((tab, index) => (
                      <TabPanel
                        key={index}
                        px={0}
                        py={4}
                        display='flex'
                        flexDirection='column'>
                        <InputGroup mb={4} flexShrink={0}>
                          <InputLeftElement pointerEvents='none'>
                            <SearchIcon color='gray.400' />
                          </InputLeftElement>
                          <Input
                            placeholder='Search networks...'
                            value={searchQueries[index] || ''}
                            onChange={(e) => handleSearchChange(index, e.target.value)}
                            size='sm'
                          />
                        </InputGroup>

                        <VStack
                          spacing={2}
                          align='stretch'
                          h={isMobile ? '50vh' : '400px'}
                          overflowY='auto'
                          overflowX='hidden'
                          css={{
                            '&::-webkit-scrollbar': {
                              width: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                              background: '#f1f1f1',
                              borderRadius: '3px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: '#c1c1c1',
                              borderRadius: '3px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                              background: '#a8a8a8',
                            },
                          }}>
                          {tab.networks.map((networkInfo) => (
                            <NetworkItem
                              key={networkInfo.id}
                              network={networkInfo}
                              currentNetworkId={network.id}
                              selectedNetworkId={selectedNetworkId || undefined}
                              onSelect={handleNetworkSelect}
                            />
                          ))}
                          {tab.networks.length === 0 && (
                            <Text color='gray.500' textAlign='center' py={8}>
                              {searchQueries[index]
                                ? 'No networks match your search'
                                : 'No networks available in this category'}
                            </Text>
                          )}
                        </VStack>
                      </TabPanel>
                    ))}
                  </TabPanels>
                </Tabs>
              </GridItem>

              <GridItem overflow='hidden' minW={0}>
                <Box
                  borderWidth={1}
                  borderColor='gray.200'
                  borderRadius='lg'
                  p={4}
                  h={isMobile ? '50vh' : '470px'}
                  w='full'
                  bg='gray.50'
                  overflow='hidden'>
                  {selectedNetwork && (
                    <NetworkDetails
                      network={selectedNetwork}
                      selectedEndpoint={selectedEndpoint}
                      onEndpointChange={setSelectedEndpoint}
                    />
                  )}
                </Box>
              </GridItem>
            </Grid>
          </ModalBody>

          {selectedNetwork && (
            <ModalFooter>
              <HStack spacing={3} w='full' justify='space-between'>
                <Text fontSize='sm' color='gray.600'>
                  Ready to connect to {selectedNetwork.name}
                </Text>
                <Button
                  colorScheme='blue'
                  onClick={handleConnect}
                  isLoading={isConnecting}
                  loadingText='Connecting...'
                  isDisabled={!selectedEndpoint}>
                  Connect to {selectedNetwork.name}
                </Button>
              </HStack>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
