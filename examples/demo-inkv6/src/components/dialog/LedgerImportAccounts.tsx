import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Box,
  HStack,
  Spinner,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { LedgerWallet } from 'typink';

interface LedgerAccount {
  index: number;
  address: string;
  publicKey: string;
}

interface LedgerImportAccountsProps {
  isOpen: boolean;
  onClose: () => void;
}

const handleLedgerError = (error: unknown): string => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  
  if (errorMessage.includes('No device selected') || errorMessage.includes('device not found')) {
    return 'Please connect your Ledger device and try again';
  } else if (errorMessage.includes('TransportOpenUserCancelled') || errorMessage.includes('cancelled')) {
    return 'Connection cancelled. Please try again';
  } else if (errorMessage.includes('TransportInterfaceNotAvailable')) {
    return 'WebHID not available. Please use a supported browser (Chrome, Edge, Opera)';
  } else if (errorMessage.includes('Locked device') || errorMessage.includes('locked')) {
    return 'Please unlock your Ledger device and open the Polkadot app';
  } else if (errorMessage.includes('App does not seem to be open') || errorMessage.includes('app not open')) {
    return 'Please open the Polkadot app on your Ledger device';
  } else if (errorMessage.includes('The device is already open')) {
    return 'Device connection recovered';
  } else if (errorMessage.includes('connection')) {
    return 'Connection failed. Please check your device and try again';
  }
  
  return errorMessage;
};

export default function LedgerImportAccounts({ isOpen, onClose }: LedgerImportAccountsProps) {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const walletRef = useRef<LedgerWallet | null>(null);
  const toast = useToast();

  const withLedgerConnection = async <T,>(operation: (wallet: LedgerWallet) => Promise<T>): Promise<T> => {
    if (!walletRef.current) {
      throw new Error('Ledger wallet not initialized');
    }
    
    const wallet = walletRef.current;
    await wallet.ensureInitialized();
    
    try {
      const result = await operation(wallet);
      await wallet.ensureClosed();
      return result;
    } catch (error) {
      await wallet.ensureClosed();
      throw error;
    }
  };

  useEffect(() => {
    if (isOpen) {
      void initializeLedger();
    } else {
      void cleanup();
    }
  }, [isOpen]);

  const cleanup = async () => {
    if (walletRef.current) {
      try {
        await walletRef.current.ensureClosed();
      } catch (error) {
        console.warn('Error closing Ledger connection:', error);
      }
      walletRef.current = null;
    }
    setAccounts([]);
    setCurrentIndex(0);
    setIsConnecting(false);
    setIsImporting(false);
    setError(null);
    setIsConnected(false);
  };

  const initializeLedger = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      walletRef.current = new LedgerWallet({} as any);
      
      await withLedgerConnection(async () => {
        return Promise.resolve();
      });

      setIsConnected(true);

      toast({
        title: 'Ledger Connected',
        description: 'Successfully connected to your Ledger device',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await importFirstAccount();
    } catch (err) {
      console.log(err);
      const errorMessage = handleLedgerError(err);
      setError(errorMessage);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const importFirstAccount = async () => {
    try {
      const firstAccount = await withLedgerConnection(async (wallet) => {
        return await wallet.getSS58Address(0, 42);
      });
      
      setAccounts([firstAccount]);
      setCurrentIndex(1);
      
      toast({
        title: 'First Account Imported',
        description: 'Successfully imported account #0',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.log(err);
      const errorMessage = handleLedgerError(err);
      setError(errorMessage);
    }
  };

  const importNextAccount = async () => {
    setIsImporting(true);
    setError(null);

    try {
      const account = await withLedgerConnection(async (wallet) => {
        return await wallet.getSS58Address(currentIndex, 42);
      });
      
      setAccounts((prev) => [...prev, account]);
      setCurrentIndex((prev) => prev + 1);

      toast({
        title: 'Account Imported',
        description: `Successfully imported account #${currentIndex}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.log(err);
      const errorMessage = handleLedgerError(err);
      setError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRetryConnection = async () => {
    await cleanup();
    void initializeLedger();
  };

  const formatAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='lg'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Import Ledger Accounts</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align='stretch'>
            {isConnecting && (
              <Box textAlign='center' py={8}>
                <Spinner size='xl' mb={4} />
                <Text>Connecting to Ledger...</Text>
                <Text fontSize='sm' color='gray.500' mt={2}>
                  Please connect your device and open the Polkadot app
                </Text>
              </Box>
            )}

            {error && !isConnecting && (
              <Alert status='error' borderRadius='md'>
                <AlertIcon />
                <Box>
                  <Text>{error}</Text>
                  <Button size='sm' mt={2} onClick={handleRetryConnection}>
                    Retry Connection
                  </Button>
                </Box>
              </Alert>
            )}

            {isConnected && !isConnecting && (
              <>
                <Alert status='success' borderRadius='md'>
                  <AlertIcon />
                  <Text>Ledger connected successfully</Text>
                </Alert>

                <Divider />

                <Box>
                  <Text fontWeight='bold' mb={3}>
                    Imported Accounts ({accounts.length})
                  </Text>
                  <VStack spacing={2} align='stretch'>
                    {accounts.map((account) => (
                      <Box
                        key={account.index}
                        p={3}
                        borderWidth={1}
                        borderRadius='md'
                        borderColor='gray.200'
                        _hover={{ borderColor: 'blue.400' }}>
                        <HStack justify='space-between'>
                          <Box>
                            <Text fontSize='sm' color='gray.500'>
                              Account #{account.index}
                            </Text>
                            <Text fontFamily='mono' fontSize='sm'>
                              {formatAddress(account.address)}
                            </Text>
                          </Box>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>

                <Button
                  colorScheme='blue'
                  onClick={importNextAccount}
                  isLoading={isImporting}
                  loadingText='Importing...'
                  isDisabled={!isConnected}
                  width='full'>
                  Import Next Account (#{currentIndex})
                </Button>

                <Text fontSize='xs' color='gray.500' textAlign='center'>
                  Import accounts one by one from your Ledger device
                </Text>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
