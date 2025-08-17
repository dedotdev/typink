import { Button, VStack, Input, Heading, Text, Spinner, Box, Flex } from '@chakra-ui/react';
import { useState } from 'react';
import { useDebounce } from 'react-use';
import { useTypink, useTx, useTxFee, useBalance, formatBalance } from 'typink';
import { txToaster } from '@/utils/txToaster.tsx';
import { PolkadotApi } from '@dedot/chaintypes';
import RecipientSelector from './RecipientSelector';

// Simple address validation helper
const isValidPolkadotAddress = (address: string): boolean => {
  // Basic validation - should be 47-48 characters and start with '1' for Polkadot
  return /^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address.trim());
};

// Parse amount string to bigint (converts from display units to chain units)
const parseAmount = (amountStr: string, decimals: number = 10): bigint | null => {
  try {
    const trimmed = amountStr.trim();
    if (!trimmed || isNaN(Number(trimmed))) return null;

    const amount = parseFloat(trimmed);
    if (amount <= 0) return null;

    // Convert display units to chain units using network decimals
    const multiplier = Math.pow(10, decimals);
    return BigInt(Math.floor(amount * multiplier));
  } catch {
    return null;
  }
};

export default function TransferKeepAliveExample() {
  const { client, connectedAccount, network } = useTypink<PolkadotApi>();
  const [recipient, setRecipient] = useState('');
  const [amountStr, setAmountStr] = useState('');

  // Get current balance of connected account
  const currentBalance = useBalance(connectedAccount?.address);

  // Debounce inputs to avoid excessive fee calculations
  const [debouncedRecipient, setDebouncedRecipient] = useState(recipient);
  const [debouncedAmountStr, setDebouncedAmountStr] = useState(amountStr);

  useDebounce(() => setDebouncedRecipient(recipient), 150, [recipient]);
  useDebounce(() => setDebouncedAmountStr(amountStr), 150, [amountStr]);

  // Validation
  const isValidRecipient = isValidPolkadotAddress(debouncedRecipient);
  const parsedAmount = parseAmount(debouncedAmountStr, network?.decimals || 10);
  const isValidAmount = parsedAmount !== null && parsedAmount > 0n;

  // Create transferKeepAlive transaction
  const transferTx = useTx((tx) => tx.balances.transferKeepAlive);

  const {
    fee: estimatedFee,
    isLoading: feeLoading,
    error: feeError,
  } = useTxFee({
    tx: transferTx,
    args: [debouncedRecipient, parsedAmount || 0n],
    enabled: isValidRecipient && isValidAmount,
  });

  const handleTransfer = async () => {
    if (!isValidRecipient || !parsedAmount) {
      return;
    }

    const toaster = txToaster('Submitting transfer transaction...');

    try {
      await transferTx.signAndSend({
        args: [debouncedRecipient, parsedAmount],
        callback: (result) => {
          toaster.onTxProgress(result);

          const { status } = result;

          if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
            // Reset form on success
            setRecipient('');
            setAmountStr('');
          }
        },
      });
    } catch (error: any) {
      console.error('Error sending transfer:', error);
      toaster.onTxError(error);
    }
  };

  const canSubmit = isValidRecipient && isValidAmount && !transferTx.inBestBlockProgress;

  return (
    <VStack spacing={4} align='stretch' maxW='400px' mx='auto'>
      <Heading size='md'>Transfer Balance</Heading>
      <Text fontSize='sm' color='gray.600'>
        Transfer {network?.symbol || 'tokens'} to another account using transferKeepAlive (maintains minimum balance).
      </Text>

      {/* Current Balance Display */}
      {connectedAccount && (
        <Flex
          p={3}
          alignItems='center'
          justifyContent='space-between'
          bg='blue.50'
          borderRadius='md'
          border='1px solid'
          borderColor='blue.200'>
          <Text fontSize='sm' fontWeight='medium' color='blue.700'>
            Current Balance:
          </Text>
          <Text fontSize='sm' color='blue.800' fontWeight='bold'>
            {formatBalance(currentBalance?.free, network)}
          </Text>
        </Flex>
      )}

      <RecipientSelector
        value={recipient}
        onChange={setRecipient}
        isDisabled={!connectedAccount || transferTx.inBestBlockProgress}
        isInvalid={recipient.length > 0 && !isValidPolkadotAddress(recipient)}
      />

      <Input
        placeholder={`Enter amount in ${network?.symbol || 'tokens'} (e.g., 0.1)`}
        value={amountStr}
        onChange={(e) => setAmountStr(e.target.value)}
        isDisabled={!connectedAccount || transferTx.inBestBlockProgress}
        isInvalid={amountStr.length > 0 && !isValidAmount}
        type='number'
        step='0.000000001'
        min='0'
      />

      {amountStr.length > 0 && !isValidAmount && (
        <Text fontSize='xs' color='red.500'>
          Please enter a valid amount greater than 0
        </Text>
      )}

      {/* Estimated Fee Display */}
      {connectedAccount && isValidRecipient && isValidAmount && (
        <Flex
          p={3}
          alignItems='center'
          justifyContent='space-between'
          bg='gray.50'
          borderRadius='md'
          border='1px solid'
          borderColor='gray.200'>
          <Text fontSize='sm' fontWeight='medium' color='gray.700'>
            Estimated Fee:
          </Text>
          {feeLoading ? (
            <Box display='flex' alignItems='center' mt={1}>
              <Spinner size='xs' mr={2} />
              <Text fontSize='sm' color='gray.600'>
                Calculating...
              </Text>
            </Box>
          ) : feeError ? (
            <Text fontSize='sm' color='red.500' mt={1}>
              {feeError}
            </Text>
          ) : estimatedFee ? (
            <Text fontSize='sm' color='green.600' fontWeight='bold' mt={1}>
              {formatBalance(estimatedFee, network)}
            </Text>
          ) : null}
        </Flex>
      )}

      <Button
        colorScheme='green'
        onClick={handleTransfer}
        isLoading={transferTx.inBestBlockProgress}
        isDisabled={!client || !connectedAccount || !canSubmit}
        loadingText='Transferring...'>
        Transfer {network?.symbol || 'Tokens'}
      </Button>

      {!connectedAccount && (
        <Text fontSize='sm' color='orange.600' textAlign='center'>
          Please connect your wallet to send transfers
        </Text>
      )}

      {connectedAccount && (!isValidRecipient || !isValidAmount) && (recipient.length > 0 || amountStr.length > 0) && (
        <Text fontSize='xs' color='gray.500' textAlign='center'>
          Enter a valid recipient address and amount to see fee estimate
        </Text>
      )}
    </VStack>
  );
}
