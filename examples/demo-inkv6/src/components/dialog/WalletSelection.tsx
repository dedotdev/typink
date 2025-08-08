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
  Stack,
  useDisclosure,
} from '@chakra-ui/react';
import { ThemingProps } from '@chakra-ui/system';
import { useTypink, Wallet, LedgerWallet } from 'typink';
import LedgerImportAccounts from './LedgerImportAccounts';

interface WalletButtonProps {
  walletInfo: Wallet;
  afterSelectWallet?: () => void;
}

const WalletButton = ({ walletInfo, afterSelectWallet }: WalletButtonProps) => {
  const { name, id, logo, ready, installed } = walletInfo;
  const { connectWallet } = useTypink();
  const { isOpen: isLedgerOpen, onOpen: onLedgerOpen, onClose: onLedgerClose } = useDisclosure();

  const doConnectWallet = () => {
    // If this is a Ledger wallet, only open the import accounts dialog
    // Don't connect immediately - let user review/import accounts first
    if (walletInfo instanceof LedgerWallet) {
      onLedgerOpen();
      // afterSelectWallet && afterSelectWallet(); // Close wallet selection modal
      return;
    }

    // For non-Ledger wallets, connect immediately as before
    connectWallet(id);
    afterSelectWallet && afterSelectWallet();
  };

  return (
    <>
      <Button
        onClick={doConnectWallet}
        isLoading={installed && !ready}
        isDisabled={!installed}
        loadingText={name}
        size='lg'
        width='full'
        justifyContent='flex-start'
        alignItems='center'
        gap={4}>
        <img src={logo} alt={`${name}`} width={24} />
        <span>{name}</span>
      </Button>

      {/* Show Ledger import dialog if this is a Ledger wallet */}
      {walletInfo instanceof LedgerWallet && <LedgerImportAccounts isOpen={isLedgerOpen} onClose={onLedgerClose} />}
    </>
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

export default function WalletSelection({
  buttonStyle = ButtonStyle.BUTTON,
  buttonLabel = 'Connect Wallet',
  buttonProps,
}: WalletSelectionProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { wallets } = useTypink();

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

      <Modal onClose={onClose} size='sm' isOpen={isOpen}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Wallet to Connect</ModalHeader>
          <ModalCloseButton />
          <ModalBody mb={4}>
            <Stack>
              {wallets.map((one) => (
                <WalletButton key={one.id} walletInfo={one} afterSelectWallet={onClose} />
              ))}
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
