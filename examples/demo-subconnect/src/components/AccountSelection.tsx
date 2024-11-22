import { Box, Button, Flex, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { useEffect, useMemo } from 'react';
import ConnectedWallet from '@/components/dialog/ConnectedWallet.tsx';
import { formatBalance, shortenAddress } from '@/utils/string.ts';
import { useBalances, useTypink } from 'typink';
import { useApp } from '@/providers/AppProvider.tsx';
import { useConnectWallet } from '@subwallet-connect/react';

export default function AccountSelection() {
  const [{ wallet }, _, disconnect] = useConnectWallet();
  const { connectedAccount, setConnectedAccount } = useApp();
  const { network } = useTypink();

  const accounts = useMemo(
    () => (wallet?.accounts || []).map((a) => ({ address: a.address, name: a.uns?.name })),
    [wallet],
  );
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts]);
  const balances = useBalances(addresses);

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
          <ConnectedWallet />

          {accounts.map((one) => (
            <MenuItem
              backgroundColor={one.address === address ? 'gray.200' : ''}
              gap={2}
              key={one.address}
              onClick={() => setConnectedAccount(one)}>
              <Flex direction='column'>
                <Text fontWeight='500'>{one.name}</Text>

                <Text fontSize='xs'>Address: {shortenAddress(one.address)}</Text>
                <Text fontSize='xs'>
                  Balance: {formatBalance(balances[one.address]?.free) || '0'} {network.symbol}
                </Text>
              </Flex>
            </MenuItem>
          ))}
          <MenuDivider />
          <MenuItem onClick={() => disconnect(wallet!)} color='red.500'>
            Sign Out
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}
