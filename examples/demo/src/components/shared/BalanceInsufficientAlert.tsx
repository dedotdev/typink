import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Link } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useBalance, useTypink } from 'typink';

const DEFAULT_FAUCET_URL = 'https://github.com/use-ink/contracts-ui/blob/master/FAUCETS.md';

export default function BalanceInsufficientAlert() {
  const { network, selectedAccount } = useTypink();

  const balance = useBalance(selectedAccount?.address);

  if (balance === undefined || balance.free > 0n) return null;

  return (
    <Alert status='warning' mb={4}>
      <AlertIcon />
      <Box>
        <AlertTitle>Balance insufficient to make transactions</AlertTitle>
        <AlertDescription>
          <Link href={network.faucetUrl || DEFAULT_FAUCET_URL} isExternal>
            Claim some testnet token from faucet now! <ExternalLinkIcon mx='2px' />
          </Link>
        </AlertDescription>
      </Box>
    </Alert>
  );
}
