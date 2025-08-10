import { Button, VStack, Input, Heading, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { useTypink, useTx } from 'typink';
import { txToaster } from '@/utils/txToaster.tsx';
import { PolkadotApi } from '@dedot/chaintypes';

export default function RemarkTransactionExample() {
  const { client, connectedAccount } = useTypink<PolkadotApi>();
  const [message, setMessage] = useState('Hello from Typink!');
  const remarkTx = useTx(client, 'system', 'remark');

  const handleSendRemark = async () => {
    const toaster = txToaster('Submitting remark transaction...');

    try {
      await remarkTx.signAndSend({
        args: [message],
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
