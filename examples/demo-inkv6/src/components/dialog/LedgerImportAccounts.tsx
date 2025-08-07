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
} from '@chakra-ui/react';
import { useState } from 'react';
import { EditIcon, CheckIcon, DeleteIcon } from '@chakra-ui/icons';
import { useLedgerConnect } from '@/providers';
import { HardwareSource } from '@/types/hardware';

interface LedgerImportAccountsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LedgerImportAccounts({ isOpen, onClose }: LedgerImportAccountsProps) {
  const {
    hardwareAccounts,
    connectionState,
    connectLedger,
    importNextAccount,
    removeAccount,
    updateAccountName,
    retryConnection,
  } = useLedgerConnect();

  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const ledgerAccounts = hardwareAccounts.filter(acc => acc.source === HardwareSource.Ledger);

  const handleImportNext = async () => {
    setIsImporting(true);
    try {
      await importNextAccount();
    } catch (error) {
      console.log('Import failed:', error);
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
                <Box>
                  <Text>{connectionState.error}</Text>
                  <Button size='sm' mt={2} onClick={retryConnection}>
                    Retry Connection
                  </Button>
                </Box>
              </Alert>
            )}

            {!connectionState.isConnected && !connectionState.isConnecting && !connectionState.error && (
              <Box textAlign='center' py={4}>
                <Text mb={4}>Connect your Ledger device to import accounts</Text>
                <Button colorScheme='blue' onClick={connectLedger}>
                  Connect Ledger
                </Button>
              </Box>
            )}

            {connectionState.isConnected && !connectionState.isConnecting && (
              <>
                <Alert status='success' borderRadius='md'>
                  <AlertIcon />
                  <Text>Ledger connected successfully</Text>
                </Alert>

                <Divider />

                <Box>
                  <Text fontWeight='bold' mb={3}>
                    Imported Accounts ({ledgerAccounts.length})
                  </Text>
                  <VStack spacing={2} align='stretch'>
                    {ledgerAccounts.map((account) => (
                      <Box
                        key={account.address}
                        p={3}
                        borderWidth={1}
                        borderRadius='md'
                        borderColor='gray.200'
                        _hover={{ borderColor: 'blue.400' }}
                      >
                        <HStack justify='space-between' align='flex-start'>
                          <Box flex={1}>
                            <HStack mb={1}>
                              <Text fontSize='sm' color='gray.500'>
                                Account #{account.index}
                              </Text>
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
                            
                            <Text fontFamily='mono' fontSize='sm' color='gray.600'>
                              {formatAddress(account.address)}
                            </Text>
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
                    ))}
                  </VStack>
                </Box>

                <Button
                  colorScheme='blue'
                  onClick={handleImportNext}
                  isLoading={isImporting}
                  loadingText='Importing...'
                  isDisabled={!connectionState.isConnected}
                  width='full'
                >
                  Import Next Account (#{connectionState.currentIndex})
                </Button>

                <Text fontSize='xs' color='gray.500' textAlign='center'>
                  Accounts are automatically saved and will persist across sessions
                </Text>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}