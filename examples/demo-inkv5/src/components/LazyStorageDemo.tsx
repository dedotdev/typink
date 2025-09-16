import { Box, Button, Checkbox, Divider, Heading, Input, Text } from '@chakra-ui/react';
import { useRef, useState } from 'react';
import WalletSelection from '@/components/dialog/WalletSelection.tsx';
import PendingText from '@/components/shared/PendingText.tsx';
import { ContractId } from 'contracts/deployments';
import { Psp22ContractApi } from 'contracts/types/psp22';
import {
  useContract,
  useLazyStorage,
  useRootStorage,
  useContractTx,
  useTypink,
  formatBalance,
  txToaster,
} from 'typink';

export default function LazyStorageDemo() {
  const { contract } = useContract<Psp22ContractApi>(ContractId.PSP22);
  const { connectedAccount } = useTypink();
  const inputAddressRef = useRef<HTMLInputElement>(null);
  const [targetAddress, setTargetAddress] = useState('');
  const [watchBalance, setWatchBalance] = useState(false);

  // Example 1: Fetch root storage (totalSupply, name, symbol, decimals)
  const {
    storage: rootStorage,
    isLoading: loadingRootStorage,
    refresh: refreshRootStorage,
  } = useRootStorage({ contract });

  const totalSupply = rootStorage?.data?.totalSupply;
  const tokenName = rootStorage?.name;
  const tokenSymbol = rootStorage?.symbol;
  const tokenDecimals = rootStorage?.decimals;

  // Example 2: Fetch user's balance using lazy mapping
  const { data: myBalance, isLoading: loadingMyBalance } = useLazyStorage(
    !!connectedAccount?.address
      ? {
          contract,
          accessor: (lazy) => lazy.data.balances.get(connectedAccount.address!),
          watch: true, // Watch for changes
        }
      : undefined,
  );

  // Example 3: Fetch specific address balance with manual control
  const {
    data: targetBalance,
    isLoading: loadingTargetBalance,
    refresh: refreshTargetBalance,
  } = useLazyStorage(
    !!targetAddress
      ? {
          contract,
          accessor: (lazy) => lazy.data.balances.get(targetAddress),
          watch: watchBalance,
        }
      : undefined,
  );

  const handleCheckBalance = () => {
    if (!inputAddressRef.current) return;
    setTargetAddress(inputAddressRef.current.value);
  };

  const handleClearAddress = () => {
    if (inputAddressRef.current) {
      inputAddressRef.current.value = '';
    }
    setTargetAddress('');
  };

  // Example 4: Token minting with useTx and txToaster
  const mintTx = useContractTx(contract, 'psp22MintableMint');

  const handleMintTokens = async () => {
    if (!tokenDecimals) return;

    const toaster = txToaster('Minting 100 tokens...');
    try {
      await mintTx.signAndSend({
        args: [BigInt(100 * Math.pow(10, tokenDecimals))],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            refreshRootStorage().catch(console.error);
          }
          toaster.onTxProgress(progress);
        },
      });
    } catch (e: any) {
      console.error(e);
      toaster.onTxError(e);
    }
  };

  const tokenFormatOptions = { symbol: tokenSymbol, decimals: tokenDecimals };

  return (
    <Box>
      <Heading size='md'>Lazy Storage Demo (ink! v5)</Heading>
      <Text fontSize='sm' color='gray.600' mt={2}>
        Demonstrating type-safe lazy storage access with the useLazyStorage hook
      </Text>

      {/* Token Information Section */}
      <Box mt={6}>
        <Heading size='sm' mb={3}>
          Token Information (Root Storage)
        </Heading>
        <Box bg='gray.50' p={4} borderRadius='md'>
          <Text fontSize='xs' color='blue.600' mb={3}>
            💡 These fields are fetched using useRootStorage() - they're part of the contract's main storage structure
          </Text>
          <Box mb={2}>
            <Text as='span' fontWeight='500'>
              Name:{' '}
            </Text>
            <PendingText fontWeight='600' isLoading={loadingRootStorage}>
              {tokenName || 'N/A'}
            </PendingText>
          </Box>
          <Box mb={2}>
            <Text as='span' fontWeight='500'>
              Symbol:{' '}
            </Text>
            <PendingText fontWeight='600' isLoading={loadingRootStorage}>
              {tokenSymbol || 'N/A'}
            </PendingText>
          </Box>
          <Box mb={2}>
            <Text as='span' fontWeight='500'>
              Decimals:{' '}
            </Text>
            <PendingText fontWeight='600' isLoading={loadingRootStorage}>
              {tokenDecimals?.toString() || 'N/A'}
            </PendingText>
          </Box>
          <Box>
            <Text as='span' fontWeight='500'>
              Total Supply:{' '}
            </Text>
            <PendingText fontWeight='600' isLoading={loadingRootStorage}>
              {formatBalance(totalSupply, tokenFormatOptions)}
            </PendingText>
            <Button size='xs' ml={2} onClick={refreshRootStorage} variant='outline'>
              Refresh
            </Button>
          </Box>
        </Box>
      </Box>

      <Divider my={6} />

      {/* My Balance Section */}
      <Box>
        <Heading size='sm' mb={3}>
          My Balance (Lazy Mapping with Watch)
        </Heading>
        <Box bg='blue.50' p={4} borderRadius='md'>
          <Text fontSize='xs' color='blue.600' mb={3}>
            💡 This uses useLazyStorage() to fetch individual balance from the lazy mapping
          </Text>
          {connectedAccount ? (
            <Box>
              <Text fontSize='sm' color='gray.600' mb={2}>
                Account: {connectedAccount.address}
              </Text>
              <Box>
                <Text as='span' fontWeight='500'>
                  Balance:{' '}
                </Text>
                <PendingText fontWeight='600' isLoading={loadingMyBalance}>
                  {formatBalance(myBalance, tokenFormatOptions)}
                </PendingText>
              </Box>
              <Text fontSize='xs' color='green.600' mt={1}>
                ✓ Auto-updating on new blocks
              </Text>
            </Box>
          ) : (
            <Box>
              <Text mb={2}>Connect your wallet to see your balance:</Text>
              <WalletSelection buttonProps={{ size: 'sm' }} />
            </Box>
          )}
        </Box>
      </Box>

      <Divider my={6} />

      {/* Address Balance Check Section */}
      <Box>
        <Heading size='sm' mb={3}>
          Check Any Address Balance (Lazy Mapping)
        </Heading>
        <Box bg='yellow.50' p={4} borderRadius='md'>
          <Text fontSize='xs' color='blue.600' mb={3}>
            💡 Another example of useLazyStorage() for on-demand balance queries
          </Text>
          <Box mb={3}>
            <Text mb={2} fontWeight='500'>
              Enter address to check:
            </Text>
            <Input ref={inputAddressRef} placeholder='Enter wallet address...' size='sm' />
          </Box>

          <Box mb={3}>
            <Checkbox isChecked={watchBalance} onChange={(e) => setWatchBalance(e.target.checked)} size='sm'>
              Watch for balance changes
            </Checkbox>
          </Box>

          <Box mb={3}>
            <Button size='sm' onClick={handleCheckBalance} isLoading={loadingTargetBalance} colorScheme='blue' mr={2}>
              Check Balance
            </Button>
            <Button size='sm' onClick={handleClearAddress} variant='outline' mr={2}>
              Clear
            </Button>
            {targetAddress && (
              <Button size='sm' onClick={refreshTargetBalance} variant='outline'>
                Refresh
              </Button>
            )}
          </Box>

          {targetAddress && (
            <Box>
              <Text fontSize='sm' color='gray.600' mb={2}>
                Address: {targetAddress}
              </Text>
              <Box>
                <Text as='span' fontWeight='500'>
                  Balance:{' '}
                </Text>
                <PendingText fontWeight='600' isLoading={loadingTargetBalance}>
                  {formatBalance(targetBalance, tokenFormatOptions)}
                </PendingText>
              </Box>
              {watchBalance && (
                <Text fontSize='xs' color='green.600' mt={1}>
                  ✓ Auto-updating on new blocks
                </Text>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <Divider my={6} />

      {/* Token Minting Section */}
      <Box>
        <Heading size='sm' mb={3}>
          Token Minting (Contract Transaction)
        </Heading>
        <Box bg='green.50' p={4} borderRadius='md'>
          <Text fontSize='xs' color='blue.600' mb={3}>
            💡 This demonstrates useContractTx() and txToaster() for contract transactions
          </Text>
          {connectedAccount ? (
            <Box>
              <Text mb={3}>
                Mint 100 {tokenSymbol || 'tokens'} to your account and see the storage update in real-time!
              </Text>
              <Button
                size='sm'
                onClick={handleMintTokens}
                isLoading={mintTx.inBestBlockProgress}
                isDisabled={!tokenDecimals}
                colorScheme='green'>
                {mintTx.inBestBlockProgress ? 'Minting...' : `Mint 100 ${tokenSymbol || 'Tokens'}`}
              </Button>
              {mintTx.inBestBlockProgress && (
                <Text fontSize='xs' color='orange.600' mt={2}>
                  ⏳ Transaction in progress - watch the storage update automatically!
                </Text>
              )}
            </Box>
          ) : (
            <Box>
              <Text mb={2}>Connect your wallet to mint tokens:</Text>
              <WalletSelection buttonProps={{ size: 'sm' }} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
