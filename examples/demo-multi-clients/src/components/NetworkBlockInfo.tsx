import { VStack, Text, Spinner, Box, useColorModeValue, HStack, Tooltip, useToast } from '@chakra-ui/react';
import { useBlockInfo } from 'typink';
import { useEffect, useRef, useMemo, useState } from 'react';

interface NetworkBlockInfoProps {
  networkId: string;
  isConnected: boolean;
}

interface BlockInfoItemProps {
  label: string;
  blockNumber?: number;
  blockHash?: string;
  isHighlighted: boolean;
  isLoading: boolean;
  formatBlockNumber: (blockNumber?: number) => string;
  truncateHash: (hash?: string) => string;
  onCopyHash: (hash: string) => void;
}

function BlockInfoItem({
  label,
  blockNumber,
  blockHash,
  isHighlighted,
  isLoading,
  formatBlockNumber,
  truncateHash,
  onCopyHash,
}: BlockInfoItemProps) {
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const labelColor = useColorModeValue('gray.500', 'gray.400');

  if (isLoading) {
    return (
      <VStack spacing={0} align='center' minW={{ base: '100px', md: '120px' }}>
        <Text fontSize={{ base: 'xs', md: 'xs' }} color={labelColor} fontWeight='medium'>
          {label}
        </Text>
        <Spinner size='xs' color={label.includes('Best') ? 'blue.500' : 'green.500'} />
      </VStack>
    );
  }

  return (
    <VStack spacing={0} align='center' minW={{ base: '100px', md: '120px' }}>
      <Text fontSize={{ base: 'xs', md: 'xs' }} color={labelColor} fontWeight='medium'>
        {label}
      </Text>
      <Tooltip
        label={
          <VStack spacing={1} align='start'>
            <Text fontSize='sm' fontWeight='semibold'>
              Block #{blockNumber?.toLocaleString()}
            </Text>
            <Text fontSize='xs' fontFamily='mono' color='gray.300'>
              Hash: {truncateHash(blockHash)}
            </Text>
            <Text fontSize='xs' color='gray.400'>
              Click to copy full hash
            </Text>
          </VStack>
        }
        hasArrow
        placement='top'
        bg='gray.800'
        color='white'
        borderRadius='md'
        px={3}
        py={2}>
        <Box
          as='button'
          onClick={() => blockHash && onCopyHash(blockHash)}
          cursor='pointer'
          transition='all 0.2s'
          _hover={{ transform: 'scale(1.05)' }}
          position='relative'>
          <Text
            fontSize={{ base: 'sm', md: 'sm' }}
            color={textColor}
            fontWeight='semibold'
            fontFamily='mono'
            px={2}
            py={1}
            borderRadius='md'
            bg={isHighlighted ? 'green.100' : 'transparent'}
            boxShadow={isHighlighted ? '0 0 8px rgba(34, 197, 94, 0.4)' : 'none'}
            transition='all 0.3s ease-in-out'
            _dark={{
              bg: isHighlighted ? 'green.900' : 'transparent',
              boxShadow: isHighlighted ? '0 0 8px rgba(34, 197, 94, 0.6)' : 'none',
            }}>
            {formatBlockNumber(blockNumber)}
          </Text>
        </Box>
      </Tooltip>
    </VStack>
  );
}

export default function NetworkBlockInfo({ networkId, isConnected }: NetworkBlockInfoProps) {
  const blockInfo = useBlockInfo({ networkId });
  const toast = useToast();

  // Refs for tracking previous block numbers for animation
  const prevBestRef = useRef<number | undefined>(undefined);
  const prevFinalizedRef = useRef<number | undefined>(undefined);

  // State for animation highlighting
  const [bestHighlight, setBestHighlight] = useState(false);
  const [finalizedHighlight, setFinalizedHighlight] = useState(false);

  // Memoized formatting function
  const formatBlockNumber = useMemo(
    () =>
      (blockNumber?: number): string => {
        if (blockNumber === undefined) return '';
        return `#${blockNumber.toLocaleString()}`;
      },
    [],
  );

  // Memoized hash truncation function
  const truncateHash = useMemo(
    () =>
      (hash?: string): string => {
        if (!hash) return '';
        return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
      },
    [],
  );

  // Copy hash functionality
  const handleCopyHash = useMemo(
    () => (hash: string) => {
      navigator.clipboard
        .writeText(hash)
        .then(() => {
          toast({
            title: 'Block hash copied!',
            description: `${hash.substring(0, 20)}...`,
            status: 'success',
            duration: 2000,
            isClosable: true,
            position: 'top-right',
            size: 'sm',
          });
        })
        .catch(() => {
          toast({
            title: 'Failed to copy hash',
            description: 'Please try again',
            status: 'error',
            duration: 2000,
            isClosable: true,
            position: 'top-right',
            size: 'sm',
          });
        });
    },
    [toast],
  );

  // Animation effect for block number changes
  useEffect(() => {
    if (
      blockInfo.best?.number !== undefined &&
      prevBestRef.current !== undefined &&
      blockInfo.best.number !== prevBestRef.current
    ) {
      setBestHighlight(true);
      const timer = setTimeout(() => setBestHighlight(false), 1000);
      return () => clearTimeout(timer);
    }
    prevBestRef.current = blockInfo.best?.number;
  }, [blockInfo.best?.number]);

  useEffect(() => {
    if (
      blockInfo.finalized?.number !== undefined &&
      prevFinalizedRef.current !== undefined &&
      blockInfo.finalized.number !== prevFinalizedRef.current
    ) {
      setFinalizedHighlight(true);
      const timer = setTimeout(() => setFinalizedHighlight(false), 1000);
      return () => clearTimeout(timer);
    }
    prevFinalizedRef.current = blockInfo.finalized?.number;
  }, [blockInfo.finalized?.number]);

  // Don't show block info if not connected - MUST be after ALL hooks
  if (!isConnected) {
    return null;
  }

  return (
    <HStack 
      spacing={{ base: 4, md: 8 }} 
      align='center' 
      justify={{ base: 'space-around', md: 'center' }}
      w='100%'
    >
      <BlockInfoItem
        label='Best Block'
        blockNumber={blockInfo.best?.number}
        blockHash={blockInfo.best?.hash}
        isHighlighted={bestHighlight}
        isLoading={blockInfo.best === undefined}
        formatBlockNumber={formatBlockNumber}
        truncateHash={truncateHash}
        onCopyHash={handleCopyHash}
      />
      <BlockInfoItem
        label='Finalized'
        blockNumber={blockInfo.finalized?.number}
        blockHash={blockInfo.finalized?.hash}
        isHighlighted={finalizedHighlight}
        isLoading={blockInfo.finalized === undefined}
        formatBlockNumber={formatBlockNumber}
        truncateHash={truncateHash}
        onCopyHash={handleCopyHash}
      />
    </HStack>
  );
}
