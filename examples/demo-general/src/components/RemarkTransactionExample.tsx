import { Button, VStack, Input, Heading, Text, Spinner, Box, Flex, Select } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useDebounce } from 'react-use';
import { useTypink, useTx, useTxFee, formatBalance, txToaster, setupTxToaster } from 'typink';
import { toastLibraries, getToastAdapter, type ToastLibrary } from '@/utils/toastLibraries';
import { PolkadotApi } from '@dedot/chaintypes';

export default function RemarkTransactionExample() {
  const { client, connectedAccount, network } = useTypink<PolkadotApi>();
  const [message, setMessage] = useState('Hello from Typink!');
  const [selectedLibrary, setSelectedLibrary] = useState<ToastLibrary>('sonner');

  // Debounce message changes to avoid excessive fee calculations
  const [debouncedMessage, setDebouncedMessage] = useState(message);
  useDebounce(() => setDebouncedMessage(message), 500, [message]);

  // Setup the selected toast library whenever it changes
  useEffect(() => {
    const adapter = getToastAdapter(selectedLibrary);
    setupTxToaster({
      adapter,
      initialMessage: 'Submitting transaction...',
      autoCloseDelay: 5000,
    });
  }, [selectedLibrary]);

  // Create remarkTx for signing and sending
  const remarkTx = useTx((tx) => tx.system.remark);

  const {
    fee: estimatedFee,
    isLoading: feeLoading,
    error: feeError,
  } = useTxFee({
    tx: remarkTx,
    args: [debouncedMessage],
    enabled: debouncedMessage.trim().length > 0,
  });

  const handleSendRemark = async () => {
    const toaster = txToaster('Submitting remark transaction...');

    try {
      await remarkTx.signAndSend({
        args: [debouncedMessage],
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
    <VStack spacing={4} align='stretch' maxW='500px' mx='auto'>
      <Heading size='md'>Send System Remark with Toast Libraries</Heading>
      <Text fontSize='sm' color='gray.600'>
        Submit a remark transaction and see toast notifications using different libraries.
      </Text>

      <Input
        placeholder='Enter your remark message...'
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        isDisabled={!connectedAccount || remarkTx.inBestBlockProgress}
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
          ) : estimatedFee ? (
            <Text fontSize='sm' color='blue.600' fontWeight='bold' mt={1}>
              {formatBalance(estimatedFee, network)}
            </Text>
          ) : null}
        </Flex>
      )}

      {/* Toast Library Selector and Send Button Row */}
      <Flex gap={3} align='center'>
        <Select
          value={selectedLibrary}
          onChange={(e) => setSelectedLibrary(e.target.value as ToastLibrary)}
          size='sm'
          width='40%'
          bg='white'>
          {toastLibraries.map((lib) => (
            <option key={lib.id} value={lib.id}>
              {lib.name}
            </option>
          ))}
        </Select>

        <Button
          colorScheme='blue'
          onClick={handleSendRemark}
          isLoading={remarkTx.inBestBlockProgress}
          isDisabled={!client || !connectedAccount || !message.trim() || remarkTx.inBestBlockProgress}
          loadingText='Sending...'
          flex={1}
          size='sm'>
          Send Remark Transaction
        </Button>
      </Flex>

      {!connectedAccount && (
        <Text fontSize='sm' color='orange.600' textAlign='center'>
          Please connect your wallet to send transactions
        </Text>
      )}
    </VStack>
  );
}
