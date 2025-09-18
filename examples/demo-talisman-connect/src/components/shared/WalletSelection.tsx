import { Button, ChakraProps, Text, ThemingProps, useDisclosure } from '@chakra-ui/react';
import { useWalletConnector } from '@/providers/WalletConnectorProvider.tsx';
import { WalletSelect } from '@talismn/connect-components';
import { Props, useTypink } from 'typink';

interface WalletSelectionButtonProps extends Props {
  buttonProps?: ChakraProps & ThemingProps<'Button'>;
}

export default function WalletSelection({ buttonProps = {} }: WalletSelectionButtonProps) {
  const { appName } = useTypink();
  const { isOpen, onOpen } = useDisclosure();
  const { connectWallet } = useWalletConnector();

  return (
    <WalletSelect
      dappName={appName}
      open={isOpen}
      triggerComponent={
        <Button colorScheme='primary' onClick={onOpen} {...buttonProps}>
          Connect Wallet
        </Button>
      }
      header={<Text>Connect to your wallet</Text>}
      showAccountsList={true}
      onWalletSelected={connectWallet}
    />
  );
}
