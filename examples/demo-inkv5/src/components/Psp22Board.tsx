import { Box, Button, Checkbox, Divider, Heading, Input } from '@chakra-ui/react';
import { useRef, useState } from 'react';
import WalletSelection from '@/components/dialog/WalletSelection.tsx';
import PendingText from '@/components/shared/PendingText.tsx';
import { ContractId } from 'contracts/deployments';
import { Psp22ContractApi } from 'contracts/types/psp22';
import {
  useContract,
  useContractTx,
  usePSP22Balance,
  useTypink,
  formatBalance,
  useRootStorage,
  txToaster,
} from 'typink';

export default function Psp22Board() {
  const { contract } = useContract<Psp22ContractApi>(ContractId.PSP22);
  const { connectedAccount, network } = useTypink();
  const mintTx = useContractTx(contract, 'psp22MintableMint');
  const inputAddressRef = useRef<HTMLInputElement>(null);
  const [address, setAddress] = useState('');
  const [watch, setWatch] = useState(false);

  const { storage, isLoading, refresh: refreshStorage } = useRootStorage({ contract });

  const tokenName = storage?.name;
  const tokenSymbol = storage?.symbol;
  const tokenDecimal = storage?.decimals;
  const totalSupply = storage?.data?.totalSupply;

  const { data: myBalance, isLoading: loadingBalance } = usePSP22Balance({
    contractAddress: contract?.address,
    address: connectedAccount?.address,
    watch: true,
  });

  const { data: addressBalance, isLoading: loadingAnotherBalance } = usePSP22Balance({
    contractAddress: contract?.address,
    address,
    watch,
  });

  const doCheckBalance = () => {
    if (!inputAddressRef.current) return;

    setAddress(inputAddressRef.current.value);
  };

  const mintNewToken = async () => {
    if (!tokenDecimal) return;

    const toaster = txToaster('Signing transaction...');
    try {
      await mintTx.signAndSend({
        args: [BigInt(100 * Math.pow(10, tokenDecimal))],
        callback: (progress) => {
          const { status } = progress;
          console.log(status);

          if (status.type === 'BestChainBlockIncluded') {
            refreshStorage().catch(console.error);
          }

          toaster.onTxProgress(progress);
        },
      });
    } catch (e: any) {
      console.error(e);
      toaster.onTxError(e);
    } finally {
      refreshStorage().catch(console.error);
    }
  };

  return (
    <Box>
      <Heading size='md'>PSP22 Contract</Heading>
      <Box mt={4}>
        <Box mb={2}>
          Token Name:{' '}
          <PendingText fontWeight='600' isLoading={isLoading}>
            {tokenName}
          </PendingText>
        </Box>
        <Box mb={2}>
          Token Symbol:{' '}
          <PendingText fontWeight='600' isLoading={isLoading}>
            {tokenSymbol}
          </PendingText>
        </Box>
        <Box mb={2}>
          Token Decimal:{' '}
          <PendingText fontWeight='600' isLoading={isLoading}>
            {tokenDecimal}
          </PendingText>
        </Box>
        <Box mb={2}>
          Total Supply:{' '}
          <PendingText fontWeight='600' isLoading={isLoading}>
            {formatBalance(totalSupply, network)}
          </PendingText>
        </Box>
        <Divider my={4} />
        <Box>
          Address: <Input ref={inputAddressRef} />
          <Box mt={4}>
            <Checkbox checked={watch} onChange={(e) => setWatch(e.target.checked)}>
              Watch
            </Checkbox>
          </Box>
          <Button mt={4} size='sm' onClick={doCheckBalance} isLoading={!!address && loadingAnotherBalance}>
            Check Balance
          </Button>
          {addressBalance !== undefined && !!address && (
            <Box mt={4}>
              Balance:{' '}
              <PendingText fontWeight='600' isLoading={loadingAnotherBalance}>
                {formatBalance(addressBalance, network)}
              </PendingText>
            </Box>
          )}
        </Box>
        <Divider my={4} />
        <Box>
          My Balance:{' '}
          {connectedAccount ? (
            <PendingText fontWeight='600' isLoading={loadingBalance}>
              {formatBalance(myBalance, network)}
            </PendingText>
          ) : (
            <WalletSelection buttonProps={{ size: 'xs' }} />
          )}
        </Box>
        {connectedAccount && (
          <Box mt={4}>
            <Button size='sm' onClick={mintNewToken} isLoading={mintTx.inBestBlockProgress}>
              Mint 100 {tokenSymbol}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
