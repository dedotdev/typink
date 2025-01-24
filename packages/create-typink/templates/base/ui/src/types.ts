import { ReactNode } from 'react';
import { ChakraProps } from '@chakra-ui/react';

export interface Props {
  className?: string;
  children?: ReactNode;
  props?: ChakraProps;

  [prop: string]: any;
}