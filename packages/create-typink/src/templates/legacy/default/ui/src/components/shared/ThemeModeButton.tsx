import { IconButton, useColorMode } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

export default function ThemeModeButton() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      variant='ghost'
      icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      aria-label='Toggle theme'
    />
  );
}
