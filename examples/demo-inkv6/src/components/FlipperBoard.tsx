import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import PendingText from '@/components/shared/PendingText.tsx';
import { ContractId } from 'contracts/deployments';
import { useContract, useContractQuery, useContractTx } from 'typink';
import { txToaster } from '@/utils/txToaster.tsx';
import { Flipper6ContractApi } from '@/contracts/types/flipper6';

export default function FlipperBoard() {
  const { contract } = useContract<Flipper6ContractApi>(ContractId.FLIPPER);
  const setMessageTx = useContractTx(contract, 'flip');

  const { data: value, isLoading } = useContractQuery({
    contract,
    fn: 'get',
    watch: true,
  });

  console.log('value', value);

  const handleFlip = async () => {
    if (!contract) return;

    const toaster = txToaster('Signing transaction...');

    try {
      await setMessageTx.signAndSend({
        callback: ({ status }) => {
          console.log(status);

          toaster.updateTxStatus(status);
        },
      });
    } catch (e: any) {
      console.error(e, e.message);
      toaster.onError(e);
    }
  };

  return (
    <Box>
      <Heading size='md'>Flipper Contract</Heading>
      <Flex my={4} gap={2}>
        <Text>Flipper Value:</Text>
        <PendingText fontWeight='600' isLoading={isLoading} color='primary.500'>
          {value === undefined ? '---' : value ? 'TRUE' : 'FALSE'}
        </PendingText>
      </Flex>
      <Button mt={2} isLoading={setMessageTx.inBestBlockProgress} onClick={handleFlip}>
        Flip!
      </Button>
    </Box>
  );
}
