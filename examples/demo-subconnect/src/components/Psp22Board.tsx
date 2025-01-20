import { Box, Button, Divider, Heading } from '@chakra-ui/react';
import PendingText from '@/components/shared/PendingText.tsx';
import {} from '@/utils/string.ts';
import { ContractId } from 'contracts/deployments';
import { Psp22ContractApi } from 'contracts/types/psp22';
import { formatBalance, useContract, useContractQuery, useContractTx, useTypink } from 'typink';
import { txToaster } from '@/utils/txToaster.tsx';
import { ConnectWalletButton } from '@/components/shared/ConnectWalletButton.tsx';

export default function Psp22Board() {
  const { contract } = useContract<Psp22ContractApi>(ContractId.PSP22);
  const { defaultCaller, connectedAccount, network } = useTypink();
  const mintTx = useContractTx(contract, 'psp22MintableMint');

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
  } = useContractQuery({
    contract,
    fn: 'psp22BalanceOf',
    args: [connectedAccount?.address || defaultCaller],
  });

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
            {formatBalance(totalSupply, network)}
          </PendingText>
        </Box>
        <Divider my={4} />
        <Box>
          My Balance:{' '}
          {connectedAccount ? (
            <PendingText fontWeight='600' isLoading={loadingBalance}>
              {formatBalance(myBalance, network)}
            </PendingText>
          ) : (
            <ConnectWalletButton buttonProps={{ size: 'xs' }} />
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
