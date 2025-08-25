import { Button, ChakraProps, ThemingProps } from '@chakra-ui/react';
import { useWalletConnector } from '@/providers/WalletConnectorProvider.tsx';
import { Props } from 'typink';

interface WalletSelectionButtonProps extends Props {
  buttonProps?: ChakraProps & ThemingProps<'Button'>;
}

export default function WalletSelection({ buttonProps = {} }: WalletSelectionButtonProps) {
  const { connectWallet } = useWalletConnector();

  return (
    <Button colorScheme='primary' onClick={() => connectWallet()} {...buttonProps}>
      Connect Wallet
    </Button>
  );
}
