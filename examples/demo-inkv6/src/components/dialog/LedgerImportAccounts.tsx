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
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  useDisclosure,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { EditIcon, CheckIcon, DeleteIcon, CopyIcon } from '@chakra-ui/icons';
import { useLedgerUI } from '@/providers';
import { useTypink } from 'typink';

interface LedgerImportAccountsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LedgerImportAccounts({ isOpen, onClose }: LedgerImportAccountsProps) {
  const {
    ledgerAccounts,
    connectionState,
    connectLedger,
    importNextAccount,
    removeAccount,
    updateAccountName,
    clearAllAccounts,
  } = useLedgerUI();

  const { connectWallet, setConnectedAccount } = useTypink();

  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [highlightedAccount, setHighlightedAccount] = useState<string | null>(null);
  const [isImportingNewAccount, setIsImportingNewAccount] = useState(false);
  const [accountCountBeforeImport, setAccountCountBeforeImport] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Auto-connect to Ledger when modal opens
  useEffect(() => {
    if (isOpen && !connectionState.isConnected && !connectionState.isConnecting) {
      connectLedger();
    }
  }, [isOpen]);

  // Handle highlighting after successful import when provider state updates
  useEffect(() => {
    if (isImportingNewAccount && ledgerAccounts.length > accountCountBeforeImport) {
      // Now we have the updated accounts from provider
      const newAccount = ledgerAccounts[ledgerAccounts.length - 1];

      // Scroll to bottom
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 100);

      // Highlight new account
      setHighlightedAccount(newAccount.address);

      // Reset import tracking
      setIsImportingNewAccount(false);

      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedAccount(null);
      }, 2000);
    }
  }, [ledgerAccounts.length, isImportingNewAccount, accountCountBeforeImport]);

  const handleImportNext = async () => {
    setIsImporting(true);

    // Connect to Ledger first if not connected
    if (!connectionState.isConnected) {
      try {
        await connectLedger();
      } catch (error) {
        console.log('Connection failed:', error);
        setIsImporting(false);
        return;
      }
    }

    setAccountCountBeforeImport(ledgerAccounts.length);
    setIsImportingNewAccount(true);

    try {
      await importNextAccount();
    } catch (error) {
      console.log('Import failed:', error);
      setIsImportingNewAccount(false);
    } finally {
      setIsImporting(false);
    }
  };

  const handleEditAccountName = (address: string, currentName?: string) => {
    setEditingAccount(address);
    setEditName(currentName || '');
  };

  const handleSaveAccountName = (address: string) => {
    if (editName.trim()) {
      updateAccountName(address, editName.trim());
    }
    setEditingAccount(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
    setEditName('');
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: 'Address Copied',
        description: 'Account address copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.warn('Failed to copy address:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      toast({
        title: 'Address Copied',
        description: 'Account address copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const handleConnect = async () => {
    if (ledgerAccounts.length === 0) return;

    setIsConnecting(true);
    try {
      // Connect to the Ledger wallet
      await connectWallet('ledger');

      // Use the first account as the connected account
      const firstAccount = ledgerAccounts[0];
      setConnectedAccount(firstAccount);

      toast({
        title: 'Connected to Ledger',
        description: `Successfully connected with ${firstAccount.name || 'Ledger account'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Close the modal
      onClose();
    } catch (error) {
      console.error('Failed to connect to Ledger:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Ledger wallet',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size='lg'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import Ledger Accounts</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align='stretch'>
              {connectionState.isConnecting && (
                <Box textAlign='center' py={8}>
                  <Spinner size='xl' mb={4} />
                  <Text>Connecting to Ledger...</Text>
                  <Text fontSize='sm' color='gray.500' mt={2}>
                    Please connect your device and open the Polkadot app
                  </Text>
                </Box>
              )}

              {connectionState.error && !connectionState.isConnecting && (
                <Alert status='error' borderRadius='md'>
                  <AlertIcon />
                  <Text>{connectionState.error}</Text>
                </Alert>
              )}

              {!connectionState.isConnecting && (
                <>
                  <Divider />

                  <HStack width='full' spacing={2}>
                    <Button
                      colorScheme='blue'
                      onClick={handleImportNext}
                      isLoading={isImporting}
                      loadingText='Importing...'
                      isDisabled={!connectionState.isConnected}
                      flex={1}>
                      Import Next Account (#{connectionState.currentIndex})
                    </Button>

                    {ledgerAccounts.length > 0 && (
                      <Button colorScheme='red' variant='outline' onClick={onResetOpen} size='md'>
                        Reset
                      </Button>
                    )}
                  </HStack>

                  <Box>
                    <Text fontWeight='bold' mb={3}>
                      Imported Accounts ({ledgerAccounts.length})
                    </Text>
                    <Box
                      ref={scrollContainerRef}
                      maxHeight='300px'
                      overflowY='auto'
                      border='1px solid'
                      borderColor='gray.200'
                      borderRadius='md'
                      p={2}>
                      <VStack spacing={2} align='stretch'>
                        {ledgerAccounts.length === 0 ? (
                          <Box p={8} textAlign='center' color='gray.500'>
                            <Text fontSize='sm' mb={2}>
                              No imported accounts yet
                            </Text>
                            <Text fontSize='xs'>
                              Click "Import Next Account" to add accounts from your Ledger device
                            </Text>
                          </Box>
                        ) : (
                          ledgerAccounts.map((account) => (
                            <Box
                              key={account.address}
                              p={3}
                              borderWidth={1}
                              borderRadius='md'
                              borderColor='gray.200'
                              bg={highlightedAccount === account.address ? 'green.50' : 'white'}
                              transition='all 0.3s ease'
                              _hover={{ borderColor: 'blue.400' }}>
                              <HStack justify='space-between' align='flex-start'>
                                <Box flex={1}>
                                  <HStack mb={1}>
                                    <Badge colorScheme='blue' size='sm'>
                                      #{account.index}
                                    </Badge>
                                  </HStack>

                                  {editingAccount === account.address ? (
                                    <InputGroup size='sm' mb={2}>
                                      <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder='Enter account name'
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveAccountName(account.address);
                                          } else if (e.key === 'Escape') {
                                            handleCancelEdit();
                                          }
                                        }}
                                      />
                                      <InputRightElement>
                                        <HStack spacing={1}>
                                          <IconButton
                                            icon={<CheckIcon />}
                                            size='xs'
                                            colorScheme='green'
                                            aria-label='Save name'
                                            onClick={() => handleSaveAccountName(account.address)}
                                          />
                                        </HStack>
                                      </InputRightElement>
                                    </InputGroup>
                                  ) : (
                                    <HStack mb={2}>
                                      <Text fontWeight='medium' fontSize='sm'>
                                        {account.name || `Account #${account.index}`}
                                      </Text>
                                      <IconButton
                                        icon={<EditIcon />}
                                        size='xs'
                                        variant='ghost'
                                        aria-label='Edit name'
                                        onClick={() => handleEditAccountName(account.address, account.name)}
                                      />
                                    </HStack>
                                  )}

                                  <HStack spacing={2} align='center'>
                                    <Text fontFamily='mono' fontSize='sm' color='gray.600'>
                                      {formatAddress(account.address)}
                                    </Text>
                                    <IconButton
                                      icon={<CopyIcon />}
                                      size='xs'
                                      variant='ghost'
                                      aria-label='Copy address'
                                      onClick={() => handleCopyAddress(account.address)}
                                      _hover={{ bg: 'gray.100' }}
                                    />
                                  </HStack>
                                </Box>

                                <IconButton
                                  icon={<DeleteIcon />}
                                  size='sm'
                                  variant='ghost'
                                  colorScheme='red'
                                  aria-label='Remove account'
                                  onClick={() => removeAccount(account.address)}
                                />
                              </HStack>
                            </Box>
                          ))
                        )}
                      </VStack>
                    </Box>
                  </Box>

                  <Text fontSize='xs' color='gray.500' textAlign='center'>
                    Accounts are automatically saved and will persist across sessions
                  </Text>

                  <Divider my={4} />

                  <HStack justify='flex-end' spacing={3}>
                    <Button variant='ghost' onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      colorScheme='blue'
                      onClick={handleConnect}
                      isLoading={isConnecting}
                      loadingText='Connecting...'
                      isDisabled={ledgerAccounts.length === 0}>
                      Connect
                    </Button>
                  </HStack>
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isResetOpen} onClose={onResetClose} size='sm'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Clear All Accounts</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>
              Are you sure you want to clear all imported hardware accounts? This action cannot be undone.
            </Text>
            <HStack justify='flex-end' spacing={3}>
              <Button variant='ghost' onClick={onResetClose}>
                Cancel
              </Button>
              <Button
                colorScheme='red'
                onClick={() => {
                  clearAllAccounts();
                  onResetClose();
                }}>
                Clear All
              </Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
