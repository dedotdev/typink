import {
  Box,
  Button,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import { NetworkId, useTypink } from 'typink';

function NetworkStatusIndicator() {
  const { ready } = useTypink();

  if (ready) {
    return <Box borderRadius='50%' width={2} height={2} backgroundColor='green.500' />;
  } else {
    return <Spinner size='xs' />;
  }
}

export default function NetworkSelection() {
  const { network, setNetworkId, supportedNetworks } = useTypink();
  const { colorMode } = useColorMode();
  const btnProps = colorMode === 'light' ? { color: 'primary.700', borderColor: '#EFA9D3', bgColor: '#FFF5F9' } : {};
  const colorScheme = colorMode === 'light' ? 'primary' : undefined;

  return (
    <Menu autoSelect={false}>
      <MenuButton as={Button} variant='outline' colorScheme={colorScheme} {...btnProps}>
        <Flex direction='row' align='center' gap={2}>
          <Image rounded='full' src={network.logo} alt={network.name} width={22} />
          <Text as='span' display={{ base: 'none', md: 'inline' }}>
            {network.name}
          </Text>

          <Box ml={2}>
            <NetworkStatusIndicator />
          </Box>
        </Flex>
      </MenuButton>
      <MenuList>
        {Object.values(supportedNetworks).map((one) => (
          <MenuItem
            key={one.id}
            onClick={() => setNetworkId(one.id as NetworkId)}
            backgroundColor={one.id === network.id ? 'gray.200' : ''}>
            <Flex direction='row' align='center' gap={2}>
              <Image rounded='full' src={one.logo} alt={one.name} width={18} />
              <span>{one.name}</span>
            </Flex>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
