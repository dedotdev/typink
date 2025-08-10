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
} from '@chakra-ui/react';
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
  onSelect: (networkId: string) => void;
}

function NetworkItem({ network, currentNetworkId, onSelect }: NetworkItemProps) {
  const isSelected = network.id === currentNetworkId;

  return (
    <Button
      onClick={() => onSelect(network.id)}
      variant='ghost'
      justifyContent='flex-start'
      height='auto'
      py={3}
      px={4}
      width='full'
      bg={isSelected ? 'blue.50' : 'transparent'}
      borderColor={isSelected ? 'blue.200' : 'transparent'}
      borderWidth={1}
      _hover={{
        bg: isSelected ? 'blue.100' : 'gray.50',
      }}>
      <HStack spacing={3} width='full'>
        <img
          src={network.logo}
          alt={network.name}
          width={24}
          height={24}
          style={{ borderRadius: 6, flexShrink: 0 }}
        />
        <VStack spacing={0} align='flex-start' flex={1}>
          <Text fontSize='sm' fontWeight='medium' color='gray.900'>
            {network.name}
          </Text>
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

export default function NetworkSelection() {
  const { network, setNetworkId, supportedNetworks } = useTypink();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [smallest] = useMediaQuery('(max-width: 325px)');
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const [tabIndex, setTabIndex] = useState(0);

  const networksByType = useMemo(() => {
    const networks = Object.values(supportedNetworks);
    
    return {
      all: networks,
      mainnet: networks.filter(n => n.type === NetworkType.MAINNET || !n.type), // default to mainnet if no type
      testnet: networks.filter(n => n.type === NetworkType.TESTNET),
      devnet: networks.filter(n => n.type === NetworkType.DEVNET),
    };
  }, [supportedNetworks]);

  const handleNetworkSelect = (networkId: string) => {
    setNetworkId(networkId);
    onClose();
  };

  const tabs = [
    { label: 'All', networks: networksByType.all },
    { label: 'Mainnet', networks: networksByType.mainnet },
    { label: 'Testnet', networks: networksByType.testnet },
    { label: 'Devnet', networks: networksByType.devnet },
  ];

  return (
    <>
      <Button variant='outline' onClick={onOpen}>
        <Flex direction='row' align='center' gap={2}>
          <img src={network.logo} alt={network.name} width={22} style={{ borderRadius: 4 }} />
          {!smallest && <span>{network.name}</span>}
          <Box ml={2}>
            <NetworkStatusIndicator />
          </Box>
        </Flex>
      </Button>

      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size={isMobile ? 'full' : 'lg'}
        scrollBehavior='inside'
      >
        <ModalOverlay />
        <ModalContent maxH={isMobile ? '100vh' : '80vh'}>
          <ModalHeader>Select Network</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs 
              index={tabIndex} 
              onChange={setTabIndex}
              variant='enclosed'
              colorScheme='blue'
            >
              <TabList mb={4}>
                {tabs.map((tab, index) => (
                  <Tab key={index} fontSize='sm'>
                    <HStack spacing={2}>
                      <Text>{tab.label}</Text>
                      <Badge 
                        size='sm' 
                        colorScheme='gray' 
                        variant='solid'
                        borderRadius='full'
                      >
                        {tab.networks.length}
                      </Badge>
                    </HStack>
                  </Tab>
                ))}
              </TabList>
              
              <TabPanels>
                {tabs.map((tab, index) => (
                  <TabPanel key={index} px={0} py={0}>
                    <VStack 
                      spacing={2} 
                      align='stretch'
                      maxH={isMobile ? '60vh' : '400px'}
                      overflowY='auto'
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
                      }}
                    >
                      {tab.networks.map((networkInfo) => (
                        <NetworkItem
                          key={networkInfo.id}
                          network={networkInfo}
                          currentNetworkId={network.id}
                          onSelect={handleNetworkSelect}
                        />
                      ))}
                      {tab.networks.length === 0 && (
                        <Text color='gray.500' textAlign='center' py={8}>
                          No networks available in this category
                        </Text>
                      )}
                    </VStack>
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
