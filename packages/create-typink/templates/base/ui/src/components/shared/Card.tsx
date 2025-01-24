import { Props } from '@/types.ts';
import { Box } from '@chakra-ui/react';

export function Card({ children, props }: Props) {
  return (
    <Box borderColor='gray.200' borderWidth='1px' p={4} {...props}>
      {children}
    </Box>
  )

}