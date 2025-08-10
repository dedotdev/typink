import { Button, VStack, Input, Heading, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { useTypink } from 'typink';
import { txToaster } from '@/utils/txToaster.tsx';

export default function RemarkTransactionExample() {
  const { client, connectedAccount } = useTypink();
  const [message, setMessage] = useState('Hello from Typink!');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRemark = async () => {
    const toaster = txToaster('Submitting remark transaction...');

    try {
      setIsLoading(true);

      // Validation checks
      if (!client || !connectedAccount) {
        throw new Error('No connected account or client available');
      }

      // Balance check
      const balance = await client.query.system.account(connectedAccount.address);
      if (balance.data.free <= 0n) {
        throw new Error('Insufficient balance to send transaction');
      }

      // Submit transaction
      await client.tx.system
        .remark(message)
        .signAndSend(connectedAccount.address, (result) => {
          toaster.onTxProgress(result);

          const { status } = result;

          if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
            setMessage('Hello from Typink!');
          }
        })
        .untilFinalized();
    } catch (error: any) {
      console.error('Error sending remark:', error);
      toaster.onTxError(error);
    } finally {
      setIsLoading(false);
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
        isDisabled={!connectedAccount || isLoading}
      />

      <Button
        colorScheme='blue'
        onClick={handleSendRemark}
        isLoading={isLoading}
        isDisabled={!connectedAccount || !message.trim() || isLoading}
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
