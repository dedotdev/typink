import { Badge, Flex, Text } from '@chakra-ui/react';
import { Card } from '@/components/shared/Card.tsx';
import PendingText from '@/components/shared/PendingText.tsx';
import { useBlockInfo } from '@/hooks/useBlockInfo.ts';

export function BlockInfo() {
  const { bestBlock, finalizedBlock } = useBlockInfo();

  return (
    <Card>
      <Flex alignItems='center' gap={4} justifyContent='space-around'>
        <Flex alignItems='center' gap={2}>
          <Text>Best Block:</Text>{' '}
          <PendingText isLoading={!bestBlock}>
            <Badge verticalAlign='text-bottom' colorScheme='green'>
              {bestBlock}
            </Badge>
          </PendingText>
        </Flex>
        <Flex alignItems='center' gap={2}>
          <Text>Finalized Block:</Text>
          <PendingText isLoading={!finalizedBlock}>
            <Badge colorScheme='blue' verticalAlign='text-bottom'>
              {finalizedBlock} {bestBlock && finalizedBlock && `(+${bestBlock - finalizedBlock})`}
            </Badge>
          </PendingText>
        </Flex>
      </Flex>
    </Card>
  );
}
