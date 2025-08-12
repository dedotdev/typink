import { Box, Button, Flex, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Text, Image } from '@chakra-ui/react';
import { useEffect, useMemo } from 'react';
import WalletSelection, { ButtonStyle } from '@/components/dialog/WalletSelection.tsx';
import { shortenAddress } from '@/utils/string.ts';
import { formatBalance, useBalances, useTypink } from 'typink';

export default function AccountSelection() {
  const { accounts, connectedAccount, setConnectedAccount, disconnect, network, wallets } = useTypink();
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts]);
  const balances = useBalances(addresses);

  // Helper function to get wallet by account source
  const getWalletBySource = (source: string) => wallets.find((wallet) => wallet.id === source);

  useEffect(() => {
    if (connectedAccount && accounts.map((one) => one.address).includes(connectedAccount.address)) {
      return;
    }

    setConnectedAccount(accounts[0]);
  }, [accounts]);

  if (!connectedAccount) {
    return <></>;
  }

  const { name, address } = connectedAccount;

  return (
    <Box>
      <Menu autoSelect={false}>
        <MenuButton as={Button} variant='outline'>
          <Flex align='center' gap={2}>
            <Text fontWeight='semi-bold' fontSize='md'>
              {name}
            </Text>
            <Text fontSize='sm' fontWeight='400'>
              ({shortenAddress(address)})
            </Text>
          </Flex>
        </MenuButton>

        <MenuList>
          {accounts.map((one) => {
            const wallet = getWalletBySource(one.source);
            return (
              <MenuItem
                backgroundColor={one.address === address ? 'gray.200' : ''}
                gap={2}
                key={`${one.address}-${one.source}`}
                onClick={() => setConnectedAccount(one)}>
                <Box position='relative' width='100%'>
                  <Flex direction='column'>
                    <Text fontWeight='500'>{one.name}</Text>

                    <Text fontSize='xs'>Address: {shortenAddress(one.address)}</Text>
                    <Text fontSize='xs'>Balance: {formatBalance(balances[one.address]?.free, network)}</Text>
                  </Flex>

                  {/* Wallet indicator */}
                  {wallet && (
                    <Box
                      position='absolute'
                      bottom='2px'
                      right='2px'
                      w='16px'
                      h='16px'
                      borderRadius='50%'
                      overflow='hidden'
                      bg='white'
                      border='1px solid'
                      borderColor='gray.300'
                      display='flex'
                      alignItems='center'
                      justifyContent='center'>
                      <Image src={wallet.logo} alt={wallet.name} w='12px' h='12px' borderRadius='50%' />
                    </Box>
                  )}
                </Box>
              </MenuItem>
            );
          })}
          <MenuDivider />
          <WalletSelection
            buttonStyle={ButtonStyle.MENU_ITEM}
            buttonLabel='Switch Wallet'
            buttonProps={{ color: 'primary.500' }}
          />
          <MenuItem onClick={() => disconnect()} color='red.500'>
            Sign Out
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}
