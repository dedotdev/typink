import {
  Button,
  ChakraProps,
  MenuItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Flex,
  Text,
  Badge,
  Divider,
  VStack,
} from '@chakra-ui/react';
import { ThemingProps } from '@chakra-ui/system';
import { useTypink, Wallet, TypinkAccount } from 'typink';
import { useCallback, useState } from 'react';
import AccountAvatar from '@/components/shared/AccountAvatar.tsx';

interface WalletButtonProps {
  walletInfo: Wallet;
}

const WalletButton = ({ walletInfo }: WalletButtonProps) => {
  const { name, id, logo, ready, installed } = walletInfo;
  const { connectWallet, disconnect, isWalletConnected, getAccountsByWallet } = useTypink();

  const isConnected = isWalletConnected(id);
  const accounts = getAccountsByWallet(id);
  const accountCount = accounts.length;

  const doConnectWallet = () => {
    connectWallet(id);
  };

  const doDisconnectWallet = (e: React.MouseEvent) => {
    e.stopPropagation();
    disconnect(id);
  };

  return (
    <Flex
      direction='column'
      width='full'
      border='1px solid'
      borderColor='gray.200'
      borderRadius='md'
      p={4}
      _hover={{ borderColor: 'gray.300' }}>
      <Flex align='center' justify='space-between' width='full'>
        <Flex align='center' gap={3} flex='1'>
          <img src={logo} alt={`${name}`} width={24} />
          <VStack align='start' spacing={0}>
            <Text fontWeight='medium'>{name}</Text>
            {isConnected && (
              <Text fontSize='xs' color='gray.600'>
                {accountCount} account{accountCount !== 1 ? 's' : ''} connected
              </Text>
            )}
          </VStack>
        </Flex>

        <Flex align='center' gap={2}>
          {isConnected ? (
            <>
              <Badge colorScheme='green' size='sm'>
                Connected
              </Badge>
              <Button size='sm' variant='outline' colorScheme='red' onClick={doDisconnectWallet}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              onClick={doConnectWallet}
              isLoading={installed && !ready}
              isDisabled={!installed}
              loadingText='Connecting...'
              size='sm'
              colorScheme='blue'>
              Connect
            </Button>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export enum ButtonStyle {
  BUTTON,
  MENU_ITEM,
}

interface WalletSelectionProps {
  buttonStyle?: ButtonStyle;
  buttonLabel?: string;
  buttonProps?: ChakraProps & ThemingProps<'Button'>;
}

enum ModalView {
  WALLET_SELECTION = 'wallet',
  ACCOUNT_SELECTION = 'account',
}

export default function WalletSelection({
  buttonStyle = ButtonStyle.BUTTON,
  buttonLabel = 'Connect Wallet',
  buttonProps,
}: WalletSelectionProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { wallets, accounts, connectedAccount, setConnectedAccount } = useTypink();
  const [currentView, setCurrentView] = useState<ModalView>(ModalView.WALLET_SELECTION);

  const hasConnectedWallets = accounts.length > 0;

  const handleAccountSelect = useCallback(
    (account: TypinkAccount) => {
      setConnectedAccount(account);
      handleModalClose();
    },
    [setConnectedAccount],
  );

  const handleModalClose = useCallback(() => {
    onClose();
    setCurrentView(ModalView.WALLET_SELECTION); // Reset view when closing
  }, [onClose]);

  const renderWalletSelection = () => (
    <>
      <ModalHeader>Select Wallet to Connect</ModalHeader>
      <ModalCloseButton />
      <ModalBody mb={4}>
        <VStack spacing={3}>
          {wallets.map((one) => (
            <WalletButton key={one.id} walletInfo={one} />
          ))}

          {hasConnectedWallets && (
            <>
              <Divider my={2} />
              <Button
                size='md'
                colorScheme='blue'
                variant='outline'
                width='full'
                onClick={() => setCurrentView(ModalView.ACCOUNT_SELECTION)}>
                Select Account
              </Button>
            </>
          )}
        </VStack>
      </ModalBody>
    </>
  );

  const renderAccountSelection = () => (
    <>
      <ModalHeader>
        <Flex align='center' gap={2}>
          <Button size='sm' variant='ghost' onClick={() => setCurrentView(ModalView.WALLET_SELECTION)}>
            ← Back
          </Button>
          <Text>Select Account</Text>
        </Flex>
      </ModalHeader>
      <ModalCloseButton />
      <ModalBody mb={4}>
        <VStack spacing={2}>
          {accounts.map((account) => {
            const isCurrentAccount =
              account.address === connectedAccount?.address && account.source === connectedAccount?.source;
            return (
              <Flex
                key={`${account.address}-${account.source}`}
                width='full'
                p={3}
                border='1px solid'
                borderColor={isCurrentAccount ? 'blue.300' : 'gray.200'}
                borderRadius='md'
                cursor='pointer'
                _hover={{ borderColor: 'blue.200' }}
                bg={isCurrentAccount ? 'blue.50' : 'white'}
                onClick={() => handleAccountSelect(account)}>
                <Flex align='center' gap={3} width='full'>
                  <AccountAvatar account={account} size={32} />
                  <VStack align='start' spacing={0} flex='1'>
                    <Text fontWeight='medium'>{account.name}</Text>
                    <Text fontSize='xs' color='gray.600'>
                      {account.address.slice(0, 8)}...{account.address.slice(-8)}
                    </Text>
                  </VStack>
                  {isCurrentAccount && (
                    <Badge colorScheme='blue' size='sm'>
                      Current
                    </Badge>
                  )}
                </Flex>
              </Flex>
            );
          })}
        </VStack>
      </ModalBody>
    </>
  );

  return (
    <>
      {buttonStyle === ButtonStyle.MENU_ITEM && (
        <MenuItem onClick={onOpen} {...buttonProps}>
          {buttonLabel}
        </MenuItem>
      )}
      {buttonStyle === ButtonStyle.BUTTON && (
        <Button size='md' variant='outline' onClick={onOpen} {...buttonProps}>
          {buttonLabel}
        </Button>
      )}

      <Modal onClose={handleModalClose} size='md' isOpen={isOpen} closeOnOverlayClick={false} closeOnEsc={true}>
        <ModalOverlay />
        <ModalContent>
          {currentView === ModalView.WALLET_SELECTION ? renderWalletSelection() : renderAccountSelection()}
        </ModalContent>
      </Modal>
    </>
  );
}
