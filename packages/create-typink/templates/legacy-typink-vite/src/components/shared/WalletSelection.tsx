import {
  Box,
  Button,
  ChakraProps,
  Flex,
  Heading,
  Image,
  Link,
  MenuItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Stack,
  Text,
  ThemingProps,
  useDisclosure,
} from '@chakra-ui/react';
import { GithubSvgIcon, RESOURCE_BASE_URL } from '@/components/shared/icons.tsx';
import { DownloadIcon } from '@chakra-ui/icons';
import { ExtensionWallet, useTypink, Wallet } from 'typink';
import { ButtonStyle } from '@/types.ts';

interface WalletButtonProps {
  walletInfo: Wallet;
  afterSelectWallet?: () => void;
}

const WalletButton = ({ walletInfo, afterSelectWallet }: WalletButtonProps) => {
  const { name, id, logo, ready, installed } = walletInfo;
  const { connectWallet, connectedWalletIds, disconnect } = useTypink();

  const doConnectWallet = () => {
    if (!installed) {
      if (walletInfo instanceof ExtensionWallet) {
        window.open(walletInfo.installUrl);
      }

      return;
    }

    connectedWalletIds.length > 0 && disconnect(connectedWalletIds[0]);
    connectWallet(id);
    afterSelectWallet && afterSelectWallet();
  };

  return (
    <Button
      onClick={doConnectWallet}
      isLoading={installed && !ready}
      loadingText={name}
      size='lg'
      width='full'
      variant='ghost'
      justifyContent='space-between'
      alignItems='center'
      fontSize='md'
      _hover={{ _light: { bgColor: '#FBEFF5' }, _dark: { bgColor: '#666' } }}
      gap={4}>
      <Flex alignItems='center' gap={4}>
        <Image rounded='full' src={logo} alt={`${name}`} width='32px' />
        <span>{installed ? name : `Get ${name}`}</span>
      </Flex>
      {!installed && <DownloadIcon />}
    </Button>
  );
};

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
        <Button size='md' colorScheme='primary' onClick={onOpen} {...buttonProps}>
          {buttonLabel}
        </Button>
      )}

      <Modal onClose={onClose} size={{ base: 'lg', lg: '3xl' }} isOpen={isOpen}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton color='primary.500' />
          <ModalBody p={{ base: 8, lg: 12 }}>
            <Flex gap={8}>
              <Box w={{ base: 'full', lg: '55%' }}>
                <Heading size='sm' mb={4} fontWeight='semibold'>
                  Connect to your wallet
                </Heading>
                <Stack>
                  {wallets.map((one) => (
                    <WalletButton key={one.id} walletInfo={one} afterSelectWallet={onClose} />
                  ))}
                </Stack>
              </Box>
              <Box
                w={{ base: 'full', lg: '45%' }}
                display={{ base: 'none', lg: 'block' }}
                borderLeft='solid'
                borderLeftWidth='1px'
                borderColor='var(--chakra-colors-chakra-border-color)'
                pl={8}
                pt={2}
                pb={10}>
                <TypinkIntro />
              </Box>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

function TypinkIntro() {
  return (
    <>
      <Image my={4} mx='auto' src={`${RESOURCE_BASE_URL}/typink-pink.svg`} width='6rem' />
      <Text fontSize='sm' textAlign='center'>
        Typesafe react hooks to interact with{' '}
        <Link color='primary.500' href='https://use.ink' target='_blank'>
          ink! smart contracts
        </Link>{' '}
        powered by{' '}
        <Link color='primary.500' href='https://dedot.dev' target='_blank'>
          Dedot!
        </Link>
      </Text>

      <Flex mt={6}>
        <Button
          mx={4}
          width='full'
          variant='solid'
          colorScheme='primary'
          rightIcon={<GithubSvgIcon width='16' />}
          as={'a'}
          href='https://github.com/dedotdev/typink'
          target='_blank'>
          Documentation
        </Button>
      </Flex>
    </>
  );
}
