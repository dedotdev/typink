import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Divider,
  Heading,
  Input,
} from '@chakra-ui/react';
import { useMemo, useRef, useState } from 'react';
import WalletSelection from '@/components/dialog/WalletSelection.tsx';
import PendingText from '@/components/shared/PendingText.tsx';
import { formatBalance } from '@/utils/string.ts';
import { ContractId } from 'contracts/deployments';
import { Psp22ContractApi } from 'contracts/types/psp22';
import { alephZeroTestnet, useContract, useContractQuery, useContractTx, usePSP22Balance, useTypink } from 'typink';
import { txToaster } from '@/utils/txToaster.tsx';

export default function Psp22Board() {
  const { contract } = useContract<Psp22ContractApi>(ContractId.PSP22);
  const { connectedAccount, networkId } = useTypink();
  const mintable = useMemo(() => networkId === alephZeroTestnet.id, [networkId]);
  const mintTx = useContractTx(contract, 'psp22MintableMint');
  const inputAddressRef = useRef<HTMLInputElement>(null);
  const [address, setAddress] = useState('');
  const [watch, setWatch] = useState(false);

  const { data: tokenName, isLoading: loadingTokenName } = useContractQuery({
    contract,
    fn: 'psp22MetadataTokenName',
  });

  const { data: tokenSymbol, isLoading: loadingTokenSymbol } = useContractQuery({
    contract,
    fn: 'psp22MetadataTokenSymbol',
  });

  const { data: tokenDecimal, isLoading: loadingTokenDecimal } = useContractQuery({
    contract,
    fn: 'psp22MetadataTokenDecimals',
  });

  const {
    data: totalSupply,
    isLoading: loadingTotalSupply,
    refresh: refreshTotalSupply,
  } = useContractQuery({
    contract,
    fn: 'psp22TotalSupply',
  });

  const {
    data: myBalance,
    isLoading: loadingBalance,
    refresh: refreshMyBalance,
  } = usePSP22Balance({ contractAddress: contract?.address?.address() });

  const {
    data: addressBalance,
    isLoading: loadingAnotherBalance,
    refresh: refreshAnotherBalance,
  } = usePSP22Balance({ contractAddress: contract?.address?.address(), address, watch });

  const doCheckBalance = () => {
    if (!inputAddressRef.current) return;

    setAddress(inputAddressRef.current.value);
    refreshAnotherBalance();
  };

  const mintNewToken = async () => {
    if (!tokenDecimal) return;

    const toaster = txToaster('Signing transaction...');
    try {
      await mintTx.signAndSend({
        args: [BigInt(100 * Math.pow(10, tokenDecimal))],
        callback: ({ status }) => {
          console.log(status);

          if (status.type === 'BestChainBlockIncluded') {
            refreshMyBalance();
            refreshTotalSupply();
          }

          toaster.updateTxStatus(status);
        },
      });
    } catch (e: any) {
      console.error(e);
      toaster.onError(e);
    } finally {
      refreshMyBalance();
      refreshTotalSupply();
    }
  };

  return (
    <Box>
      <Heading size='md'>PSP22 Contract</Heading>
      <Box mt={4}>
        <Box mb={2}>
          Token Name:{' '}
          <PendingText fontWeight='600' isLoading={loadingTokenName}>
            {tokenName}
          </PendingText>
        </Box>
        <Box mb={2}>
          Token Symbol:{' '}
          <PendingText fontWeight='600' isLoading={loadingTokenSymbol}>
            {tokenSymbol}
          </PendingText>
        </Box>
        <Box mb={2}>
          Token Decimal:{' '}
          <PendingText fontWeight='600' isLoading={loadingTokenDecimal}>
            {tokenDecimal}
          </PendingText>
        </Box>
        <Box mb={2}>
          Total Supply:{' '}
          <PendingText fontWeight='600' isLoading={loadingTotalSupply}>
            {formatBalance(totalSupply, tokenDecimal)} {tokenSymbol}
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
          <Button mt={4} size='sm' onClick={doCheckBalance}>
            Check Balance
          </Button>
          {addressBalance !== undefined && !!address && (
            <Box mt={4}>
              Balance:{' '}
              <PendingText fontWeight='600' isLoading={loadingAnotherBalance}>
                {formatBalance(addressBalance, tokenDecimal)} {tokenSymbol}
              </PendingText>
            </Box>
          )}
        </Box>
        <Divider my={4} />
        <Box>
          My Balance:{' '}
          {connectedAccount ? (
            <PendingText fontWeight='600' isLoading={loadingBalance}>
              {formatBalance(myBalance, tokenDecimal)} {tokenSymbol}
            </PendingText>
          ) : (
            <WalletSelection buttonProps={{ size: 'xs' }} />
          )}
        </Box>
        {connectedAccount && (
          <Box mt={4}>
            <Button size='sm' onClick={mintNewToken} isLoading={mintTx.inBestBlockProgress} isDisabled={!mintable}>
              Mint 100 {tokenSymbol}
            </Button>
            {!mintable && (
              <Alert status='info' my={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle>Minting is currently not available on POP Network contract</AlertTitle>
                  <AlertDescription>Please use Aleph Zero Testnet contract for minting tokens</AlertDescription>
                </Box>
              </Alert>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
