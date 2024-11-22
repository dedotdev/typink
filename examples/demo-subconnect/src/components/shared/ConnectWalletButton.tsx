import { Button, ChakraProps } from '@chakra-ui/react';
import { useConnectWallet } from '@subwallet-connect/react';
import { Props } from 'typink';
import { ThemingProps } from '@chakra-ui/system';

interface ConnectWalletButtonProps extends Props {
  buttonProps?: ChakraProps & ThemingProps<'Button'>;
}

export function ConnectWalletButton({ buttonProps = {} }: ConnectWalletButtonProps) {
  const [, connect] = useConnectWallet();

  return (
    <Button variant='outline' onClick={() => connect()} {...buttonProps}>
      Connect Wallet
    </Button>
  );
}
