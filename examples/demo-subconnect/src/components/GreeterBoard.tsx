import { Box, Button, Flex, FormControl, FormHelperText, FormLabel, Heading, Input, Text } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import PendingText from '@/components/shared/PendingText.tsx';
import { shortenAddress } from '@/utils/string.ts';
import { ContractId } from 'contracts/deployments';
import { GreeterContractApi } from 'contracts/types/greeter';
import {
  useBalance,
  useContract,
  useContractTx,
  useTypink,
  useWatchContractEvent,
  useWatchContractQuery,
} from 'typink';
import { txToaster } from '@/utils/txToaster.tsx';

export default function GreetBoard() {
  const { connectedAccount } = useTypink();
  const { contract } = useContract<GreeterContractApi>(ContractId.GREETER);
  const [message, setMessage] = useState('');
  const setMessageTx = useContractTx(contract, 'setMessage');
  const balance = useBalance(connectedAccount?.address);

  const { data: greet, isLoading } = useWatchContractQuery({
    contract,
    fn: 'greet',
  });

  const handleUpdateGreeting = async () => {
    if (!contract || !message) return;

    if (!connectedAccount) {
      toast.info('Please connect to your wallet');
      return;
    }

    if (balance?.free === 0n) {
      toast.error('Balance insufficient to make transaction.');
      return;
    }

    const toaster = txToaster('Signing transaction...');

    try {
      await setMessageTx.signAndSend({
        args: [message],
        callback: ({ status }) => {
          console.log(status);

          if (status.type === 'BestChainBlockIncluded') {
            setMessage('');
          }

          toaster.updateTxStatus(status);
        },
      });
    } catch (e: any) {
      console.error(e, e.message);
      toaster.onError(e);
    }
  };

  // Listen to Greeted event from system events
  // & update the greeting message in real-time
  //
  // To verify this, try open 2 tabs of the app
  // & update the greeting message in one tab,
  // you will see the greeting message updated in the other tab
  useWatchContractEvent(
    contract,
    'Greeted',
    useCallback((events) => {
      events.forEach((greetedEvent) => {
        const {
          name,
          data: { from, message },
        } = greetedEvent;

        console.log(`Found a ${name} event sent from: ${from?.address()}, message: ${message}  `);

        toast.info(
          <div>
            <p>
              Found a <b>{name}</b> event
            </p>
            <p style={{ fontSize: 12 }}>
              Sent from: <b>{shortenAddress(from?.address())}</b>
            </p>
            <p style={{ fontSize: 12 }}>
              Greeting message: <b>{message}</b>
            </p>
          </div>,
        );
      });
    }, []),
  );

  return (
    <Box>
      <Heading size='md'>Greeter Contract</Heading>
      <Flex my={4} gap={2}>
        <Text>Greeting Message:</Text>
        <PendingText fontWeight='600' isLoading={isLoading} color='primary.500'>
          {greet}
        </PendingText>
      </Flex>
      <form>
        <FormControl>
          <FormLabel>Update greeting message:</FormLabel>
          <Input
            type='input'
            maxLength={50}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            isDisabled={setMessageTx.inBestBlockProgress}
          />
          <FormHelperText>Max 50 characters</FormHelperText>
        </FormControl>
        <Button
          size='sm'
          mt={4}
          isDisabled={!message}
          isLoading={setMessageTx.inBestBlockProgress}
          onClick={handleUpdateGreeting}>
          Update Greeting
        </Button>
      </form>
    </Box>
  );
}
