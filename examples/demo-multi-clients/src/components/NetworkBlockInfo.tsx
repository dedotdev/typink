import { VStack, Text, Spinner, Box, useColorModeValue, HStack } from '@chakra-ui/react';
import { useBlockInfo } from 'typink';

interface NetworkBlockInfoProps {
  networkId: string;
  isConnected: boolean;
}

export default function NetworkBlockInfo({ networkId, isConnected }: NetworkBlockInfoProps) {
  const blockInfo = useBlockInfo({ networkId });
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const labelColor = useColorModeValue('gray.500', 'gray.400');

  // Don't show block info if not connected
  if (!isConnected) {
    return null;
  }

  console.log('blockInfo', blockInfo);

  const formatBlockNumber = (blockNumber?: number): string => {
    if (blockNumber === undefined) return '';
    return `#${blockNumber.toLocaleString()}`;
  };

  return (
    <Box textAlign='center' minWidth='120px'>
      <HStack spacing={8} align='center'>
        {/* Best Block */}
        <VStack spacing={0} align='center'>
          <Text fontSize='xs' color={labelColor} fontWeight='medium'>
            Best Block
          </Text>
          {blockInfo.best === undefined ? (
            <Spinner size='xs' color='blue.500' />
          ) : (
            <Text fontSize='sm' color={textColor} fontWeight='semibold' fontFamily='mono'>
              {formatBlockNumber(blockInfo.best.number)}
            </Text>
          )}
        </VStack>

        {/* Finalized Block */}
        <VStack spacing={0} align='center'>
          <Text fontSize='xs' color={labelColor} fontWeight='medium'>
            Finalized
          </Text>
          {blockInfo.finalized === undefined ? (
            <Spinner size='xs' color='green.500' />
          ) : (
            <Text fontSize='sm' color={textColor} fontWeight='semibold' fontFamily='mono'>
              {formatBlockNumber(blockInfo.finalized.number)}
            </Text>
          )}
        </VStack>
      </HStack>
    </Box>
  );
}
