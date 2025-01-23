import { Box, Button, Flex, Menu, MenuButton, MenuItem, MenuList, Spinner, useMediaQuery } from '@chakra-ui/react';
import { NetworkId, useTypink } from 'typink';

function NetworkStatusIndicator() {
  const { ready } = useTypink();

  if (ready) {
    return <Box borderRadius='50%' width={3} height={3} backgroundColor='green.500' />;
  } else {
    return <Spinner size='xs' />;
  }
}

export default function NetworkSelection() {
  const { network, setNetworkId, supportedNetworks } = useTypink();
  const [smallest] = useMediaQuery('(max-width: 325px)');

  return (
    <Menu autoSelect={false}>
      <MenuButton as={Button} variant='outline'>
        <Flex direction='row' align='center' gap={2}>
          <img src={network.logo} alt={network.name} width={22} style={{ borderRadius: 4 }} />
          {!smallest && <span>{network.name}</span>}

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
              <img src={one.logo} alt={one.name} width={18} style={{ borderRadius: 4 }} />
              <span>{one.name}</span>
            </Flex>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}
