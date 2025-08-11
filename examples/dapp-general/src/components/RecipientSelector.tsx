import { 
  Box, 
  Input, 
  Menu, 
  MenuButton, 
  MenuItem, 
  MenuList, 
  Text, 
  Flex,
  VStack,
  RadioGroup,
  Radio,
  Stack
} from '@chakra-ui/react';
import { useState, useMemo } from 'react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useTypink, useBalances, formatBalance } from 'typink';
import { shortenAddress } from '@/utils/string.ts';
import { PolkadotApi } from '@dedot/chaintypes';

interface RecipientSelectorProps {
  value: string;
  onChange: (address: string) => void;
  isDisabled?: boolean;
  isInvalid?: boolean;
}

// Simple address validation helper
const isValidPolkadotAddress = (address: string): boolean => {
  // Basic validation - should be 47-48 characters and start with '1' for Polkadot
  return /^[1-9A-HJ-NP-Za-km-z]{47,48}$/.test(address.trim());
};

type SelectionMode = 'accounts' | 'custom';

export default function RecipientSelector({ 
  value, 
  onChange, 
  isDisabled = false, 
  isInvalid = false 
}: RecipientSelectorProps) {
  const { accounts, connectedAccount, network } = useTypink<PolkadotApi>();
  
  // Get all accounts except the connected one
  const availableAccounts = useMemo(() => {
    return accounts.filter(acc => acc.address !== connectedAccount?.address);
  }, [accounts, connectedAccount]);

  // Get balances for all available accounts
  const accountAddresses = useMemo(() => availableAccounts.map(acc => acc.address), [availableAccounts]);
  const balances = useBalances(accountAddresses);
  
  // Find if current value matches an available account
  const selectedAccount = useMemo(() => {
    return availableAccounts.find(acc => acc.address === value);
  }, [availableAccounts, value]);
  
  // Initialize mode - default to 'accounts' if available accounts exist, otherwise 'custom'
  const [mode, setMode] = useState<SelectionMode>('accounts');

  const handleAccountSelect = (account: typeof availableAccounts[0]) => {
    onChange(account.address);
  };

  const handleCustomInput = (inputValue: string) => {
    onChange(inputValue);
  };

  const handleModeChange = (newMode: SelectionMode) => {
    setMode(newMode);
    if (newMode === 'accounts' && availableAccounts.length > 0) {
      // If switching to accounts mode and we have a selected account, keep it
      // Otherwise, select the first available account
      if (!selectedAccount) {
        onChange(availableAccounts[0].address);
      }
    } else if (newMode === 'custom') {
      // Clear the value when switching to custom mode unless it's already a custom address
      if (selectedAccount) {
        onChange('');
      }
    }
  };

  return (
    <VStack align='stretch' spacing={3}>
      {/* Radio buttons for mode selection */}
      {availableAccounts.length > 0 && (
        <RadioGroup value={mode} onChange={handleModeChange}>
          <Stack direction='row'>
            <Radio value='accounts' size='sm' isDisabled={isDisabled}>
              Select from connected accounts
            </Radio>
            <Radio value='custom' size='sm' isDisabled={isDisabled}>
              Enter custom address
            </Radio>
          </Stack>
        </RadioGroup>
      )}

      {/* Conditional rendering based on mode */}
      {mode === 'custom' || availableAccounts.length === 0 ? (
        <Box>
          <Input
            placeholder={availableAccounts.length === 0 
              ? 'Enter recipient address (no other accounts available)' 
              : 'Enter recipient address (1abc...)'
            }
            value={value}
            onChange={(e) => handleCustomInput(e.target.value)}
            isDisabled={isDisabled}
            isInvalid={isInvalid || (value.length > 0 && !isValidPolkadotAddress(value))}
          />
          {value.length > 0 && !isValidPolkadotAddress(value) && (
            <Text fontSize='xs' color='red.500' mt={1}>
              Please enter a valid Polkadot address
            </Text>
          )}
        </Box>
      ) : (
        <Menu>
          <MenuButton 
            as={Box}
            cursor='pointer'
            p={3}
            border='1px solid'
            borderColor={isInvalid ? 'red.500' : 'gray.200'}
            borderRadius='md'
            _hover={{ borderColor: 'gray.300' }}
            _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
            aria-disabled={isDisabled}
          >
            {selectedAccount ? (
              <Flex align='center' justify='space-between' width='100%'>
                <Box>
                  <Text fontSize='sm' fontWeight='medium'>
                    {selectedAccount.name}
                  </Text>
                  <Text fontSize='xs' color='gray.600'>
                    {shortenAddress(selectedAccount.address)}
                  </Text>
                </Box>
                <Flex align='center' gap={2}>
                  <Text fontSize='xs' color='gray.500'>
                    {formatBalance(balances[selectedAccount.address]?.free, network)}
                  </Text>
                  <ChevronDownIcon />
                </Flex>
              </Flex>
            ) : (
              <Flex align='center' justify='space-between' width='100%'>
                <Text color='gray.500'>Select recipient account</Text>
                <ChevronDownIcon />
              </Flex>
            )}
          </MenuButton>

          <MenuList maxH='300px' overflowY='auto'>
            {availableAccounts.map((account) => (
              <MenuItem
                key={account.address}
                onClick={() => handleAccountSelect(account)}
                bg={selectedAccount?.address === account.address ? 'gray.100' : undefined}
                isDisabled={isDisabled}
              >
                <Flex direction='column' width='100%'>
                  <Flex justify='space-between' align='center' width='100%'>
                    <Text fontWeight='medium' fontSize='sm'>
                      {account.name}
                    </Text>
                    <Text fontSize='xs' color='gray.500'>
                      {formatBalance(balances[account.address]?.free, network)}
                    </Text>
                  </Flex>
                  <Text fontSize='xs' color='gray.600'>
                    {shortenAddress(account.address)}
                  </Text>
                </Flex>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      )}
    </VStack>
  );
}