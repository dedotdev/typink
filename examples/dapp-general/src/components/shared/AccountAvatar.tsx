import { Box, Image } from '@chakra-ui/react';
import { Identicon } from '@dedot/react-identicon';
import { TypinkAccount, useTypink } from 'typink';

interface AccountAvatarProps {
  account: TypinkAccount;
  size?: number;
  showWalletIndicator?: boolean;
}

export default function AccountAvatar({ 
  account, 
  size = 32, 
  showWalletIndicator = true 
}: AccountAvatarProps) {
  const { wallets } = useTypink();
  
  // Helper function to get wallet by account source
  const getWalletBySource = (source: string) => wallets.find(wallet => wallet.id === source);
  
  const wallet = getWalletBySource(account.source);
  
  // Calculate wallet indicator size based on avatar size
  const indicatorSize = Math.max(12, Math.round(size * 0.4));
  const indicatorIconSize = Math.max(8, Math.round(indicatorSize * 0.75));
  
  return (
    <Box position="relative" display="inline-block">
      <Identicon 
        value={account.address} 
        theme="polkadot" 
        size={size} 
      />
      
      {/* Wallet indicator */}
      {showWalletIndicator && wallet && (
        <Box
          position='absolute'
          bottom='-2px'
          right='-2px'
          w={`${indicatorSize}px`}
          h={`${indicatorSize}px`}
          borderRadius='50%'
          overflow='hidden'
          bg='white'
          border='1px solid'
          borderColor='gray.300'
          display='flex'
          alignItems='center'
          justifyContent='center'
        >
          <Image 
            src={wallet.logo} 
            alt={wallet.name} 
            w={`${indicatorIconSize}px`} 
            h={`${indicatorIconSize}px`} 
            borderRadius='50%' 
          />
        </Box>
      )}
    </Box>
  );
}