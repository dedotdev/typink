import { Box, Button, Flex, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Text } from '@chakra-ui/react';
import { useMemo } from 'react';
import AccountAvatar from '@/components/shared/AccountAvatar.tsx';
import WalletSelection, { ButtonStyle } from '@/components/dialog/WalletSelection.tsx';
import { shortenAddress } from '@/utils/string.ts';
import { formatBalance, useBalances, useTypink } from 'typink';

export default function AccountSelection() {
  const { accounts, connectedAccount, setConnectedAccount, disconnect, network } = useTypink();
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts]);
  const balances = useBalances(addresses);

  if (!connectedAccount) {
    return <></>;
  }

  const { name, address, source } = connectedAccount;

  return (
    <Box>
      <Menu autoSelect={false}>
        <MenuButton as={Button} variant='outline'>
          <Flex align='center' gap={4}>
            <AccountAvatar account={connectedAccount} size={24} />
            <Flex direction='column' align='start'>
              <Text fontWeight='semi-bold' fontSize='md'>
                {name}
              </Text>
              <Text fontSize='xs' fontWeight='400' color='gray.600'>
                {shortenAddress(address)}
              </Text>
            </Flex>
          </Flex>
        </MenuButton>

        <MenuList>
          {accounts.map((one) => (
            <MenuItem
              backgroundColor={one.address === address && one.source === source ? 'gray.200' : ''}
              gap={3}
              key={`${one.address}-${one.source}`}
              onClick={() => setConnectedAccount(one)}>
              <AccountAvatar account={one} size={32} />
              <Flex direction='column' flex='1'>
                <Text fontWeight='500'>{one.name}</Text>
                <Text fontSize='xs'>Address: {shortenAddress(one.address)}</Text>
                <Text fontSize='xs'>Balance: {formatBalance(balances[one.address]?.free, network)}</Text>
              </Flex>
            </MenuItem>
          ))}
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
