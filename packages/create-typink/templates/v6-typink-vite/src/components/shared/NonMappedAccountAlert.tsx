import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, HStack, Text } from '@chakra-ui/react';
import { useCheckMappedAccount } from 'typink';
import MapAccountButton from './MapAccountButton';

export default function NonMappedAccountAlert() {
  const { isMapped, isLoading, refresh } = useCheckMappedAccount();

  if (isLoading || isMapped !== false) return null;

  const handleMappingSuccess = async () => {
    await refresh();
  };

  return (
    <Alert status='warning' mb={4}>
      <AlertIcon />
      <Box flex='1'>
        <AlertTitle>Account Not Mapped</AlertTitle>
        <AlertDescription>
          <Text mb={2}>Your account needs to be mapped before interacting with ink! v6 contracts on this network.</Text>
          <HStack mt={2} align='center'>
            <MapAccountButton variant='solid' onSuccess={handleMappingSuccess} />
          </HStack>
        </AlertDescription>
      </Box>
    </Alert>
  );
}
