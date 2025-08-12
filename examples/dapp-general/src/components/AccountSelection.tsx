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

  // // Show placeholder if no account is selected but accounts are available
  // if (!connectedAccount) {
  //   return (
  //     <Button variant='outline' isDisabled>
  //       Select Account
  //     </Button>
  //   );
  // }

  return (
    <Box>
      <Menu autoSelect={false}>
        <MenuButton as={Button} variant='outline'>
          {connectedAccount ? (
            <Flex align='center' gap={4}>
              <AccountAvatar account={connectedAccount} size={24} />
              <Flex direction='column' align='start'>
                <Text fontWeight='semi-bold' fontSize='md'>
                  {connectedAccount.name}
                </Text>
                <Text fontSize='xs' fontWeight='400' color='gray.600'>
                  {shortenAddress(connectedAccount.address)}
                </Text>
              </Flex>
            </Flex>
          ) : (
            <Text fontWeight='semi-bold' fontSize='md'>
              Select Account
            </Text>
          )}
        </MenuButton>

        <MenuList>
          {accounts.map((one) => (
            <MenuItem
              backgroundColor={
                one.address === connectedAccount?.address && one.source === connectedAccount?.source ? 'gray.200' : ''
              }
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
            buttonLabel='Connect Wallet'
            buttonProps={{ color: 'primary.500' }}
          />
          <MenuItem onClick={() => disconnect()} color='red.500'>
            Disconnect
          </MenuItem>
        </MenuList>
      </Menu>
    </Box>
  );
}
