import { ChakraProps } from '@chakra-ui/react';
import { ReactNode } from 'react';

export interface Props {
  className?: string;
  children?: ReactNode;
  props?: ChakraProps;

  [prop: string]: any;
}

export enum ButtonStyle {
  BUTTON,
  MENU_ITEM,
}
