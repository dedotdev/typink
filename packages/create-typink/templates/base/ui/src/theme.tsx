import { extendTheme } from '@chakra-ui/react';

const breakpoints = {
  sm: '30em', // 480px
  md: '632px',
  lg: '62em',
  xl: '80em',
  '2xl': '96em',
};

export const theme = extendTheme({
  colors: {
    primary: {
      50: '#ddf6ff',
      100: '#b5defc',
      200: '#89c6f4',
      300: '#5cb0ed',
      400: '#3299e7',
      500: '#187fcd', // main color
      600: '#0c63a1',
      700: '#034774',
      800: '#002a48',
      900: '#000f1e',
    },
  },
  breakpoints,
  sizes: {
    container: breakpoints,
  },
  styles: {
    global: {
      '*, *::before, *::after': {
        boxSizing: 'border-box',
      },
      a: {
        textUnderlineOffset: '2px',
      },
    },
  },
});
