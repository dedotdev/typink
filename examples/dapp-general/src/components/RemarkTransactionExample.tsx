import { Button, VStack, Input, Heading, Text, Spinner, Box, Flex } from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'react-use';
import { useTypink, useTx, formatBalance } from 'typink';
import { txToaster } from '@/utils/txToaster.tsx';
import { PolkadotApi } from '@dedot/chaintypes';

export default function RemarkTransactionExample() {
  const { client, connectedAccount, network } = useTypink<PolkadotApi>();
  const [message, setMessage] = useState('Hello from Typink!');
  const [estimatedFee, setEstimatedFee] = useState<bigint | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Debounce message changes to avoid excessive fee calculations
  const [debouncedMessage, setDebouncedMessage] = useState(message);
  useDebounce(() => setDebouncedMessage(message), 500, [message]);

  // Create remarkTx with debounced message for fee estimation
  const remarkTx = useTx((tx) => tx.system.remark(debouncedMessage));

  // Calculate estimated fee when debounced message changes
  const calculateEstimatedFee = useCallback(
    async (msg: string) => {
      if (!connectedAccount || !msg.trim()) {
        setEstimatedFee(null);
        setFeeError(null);
        return;
      }

      setFeeLoading(true);
      setFeeError(null);

      try {
        const fee = await remarkTx.estimatedFee();
        setEstimatedFee(fee);
      } catch (error: any) {
        console.error('Error estimating fee:', error);
        setFeeError('Failed to estimate fee');
        setEstimatedFee(null);
      } finally {
        setFeeLoading(false);
      }
    },
    [connectedAccount, remarkTx],
  );

  useEffect(() => {
    calculateEstimatedFee(debouncedMessage);
  }, [debouncedMessage, calculateEstimatedFee]);

  const handleSendRemark = async () => {
    const toaster = txToaster('Submitting remark transaction...');

    // Fee is already calculated and displayed, no need to recalculate here

    try {
      await remarkTx.signAndSend({
        callback: (result) => {
          toaster.onTxProgress(result);

          const { status } = result;

          if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
            setMessage('Hello from Typink!');
          }
        },
      });
    } catch (error: any) {
      console.error('Error sending remark:', error);
      toaster.onTxError(error);
    }
  };

  return (
    <VStack spacing={4} align='stretch' maxW='400px' mx='auto'>
      <Heading size='md'>Send System Remark</Heading>
      <Text fontSize='sm' color='gray.600'>
        Submit a remark transaction to the blockchain with your custom message.
      </Text>

      <Input
        placeholder='Enter your remark message...'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        isDisabled={!connectedAccount || remarkTx.inProgress}
      />

      {/* Estimated Fee Display */}
      {connectedAccount && message.trim() && (
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
          ) : estimatedFee !== null ? (
            <Text fontSize='sm' color='blue.600' fontWeight='bold' mt={1}>
              {formatBalance(estimatedFee, network)}
            </Text>
          ) : null}
        </Flex>
      )}

      <Button
        colorScheme='blue'
        onClick={handleSendRemark}
        isLoading={remarkTx.inProgress}
        isDisabled={!client || !connectedAccount || !message.trim() || remarkTx.inProgress}
        loadingText='Sending...'>
        Send Remark Transaction
      </Button>

      {!connectedAccount && (
        <Text fontSize='sm' color='orange.600' textAlign='center'>
          Please connect your wallet to send transactions
        </Text>
      )}
    </VStack>
  );
}
