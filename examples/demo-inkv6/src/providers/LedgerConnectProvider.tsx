import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';
import { LedgerConnect } from 'typink';
import { HardwareAccount, HardwareSource, LedgerConnectionState } from '@/types/hardware';

const STORAGE_KEY = 'typink/ledger/accounts';

interface LedgerConnectContextType {
  // State
  hardwareAccounts: HardwareAccount[];
  connectionState: LedgerConnectionState;
  
  // Methods
  connectLedger: () => Promise<void>;
  importNextAccount: () => Promise<void>;
  importAccountAtIndex: (index: number) => Promise<void>;
  removeAccount: (address: string) => void;
  updateAccountName: (address: string, name: string) => void;
  disconnectLedger: () => Promise<void>;
  retryConnection: () => Promise<void>;
  clearAllAccounts: () => void;
}

const LedgerConnectContext = createContext<LedgerConnectContextType | null>(null);

export const useLedgerConnect = () => {
  const context = useContext(LedgerConnectContext);
  if (!context) {
    throw new Error('useLedgerConnect must be used within a LedgerConnectProvider');
  }
  return context;
};

const handleLedgerError = (error: unknown): string => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  
  if (errorMessage.includes('No device selected') || errorMessage.includes('device not found')) {
    return 'Please connect your Ledger device and try again';
  } else if (errorMessage.includes('TransportOpenUserCancelled') || errorMessage.includes('cancelled')) {
    return 'Connection cancelled. Please try again';
  } else if (errorMessage.includes('TransportInterfaceNotAvailable')) {
    return 'WebHID not available. Please use a supported browser (Chrome, Edge, Opera)';
  } else if (errorMessage.includes('Locked device') || errorMessage.includes('locked')) {
    return 'Please unlock your Ledger device and open the Polkadot app';
  } else if (errorMessage.includes('App does not seem to be open') || errorMessage.includes('app not open')) {
    return 'Please open the Polkadot app on your Ledger device';
  } else if (errorMessage.includes('The device is already open')) {
    return 'Device connection recovered';
  } else if (errorMessage.includes('connection')) {
    return 'Connection failed. Please check your device and try again';
  }
  
  return errorMessage;
};

interface LedgerConnectProviderProps {
  children: ReactNode;
}

export const LedgerConnectProvider: React.FC<LedgerConnectProviderProps> = ({ children }) => {
  const [hardwareAccounts, setHardwareAccounts] = useState<HardwareAccount[]>([]);
  const [connectionState, setConnectionState] = useState<LedgerConnectionState>({
    isConnecting: false,
    isConnected: false,
    error: null,
    currentIndex: 0
  });
  
  const connectRef = useRef<LedgerConnect | null>(null);
  const toast = useToast();

  // Initialize accounts from localStorage
  React.useEffect(() => {
    const storedAccounts = getStoredAccounts();
    setHardwareAccounts(storedAccounts);
    
    // Set current index to the next available index
    const ledgerAccounts = storedAccounts.filter(acc => acc.source === HardwareSource.Ledger);
    const maxIndex = ledgerAccounts.length > 0 ? Math.max(...ledgerAccounts.map(acc => acc.index)) : -1;
    setConnectionState(prev => ({ ...prev, currentIndex: maxIndex + 1 }));
  }, []);

  const getStoredAccounts = (): HardwareAccount[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load hardware accounts from localStorage:', error);
      return [];
    }
  };

  const saveAccounts = (accounts: HardwareAccount[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
      setHardwareAccounts(accounts);
    } catch (error) {
      console.warn('Failed to save hardware accounts to localStorage:', error);
    }
  };

  const withLedgerConnection = async <T,>(operation: (connect: LedgerConnect) => Promise<T>): Promise<T> => {
    if (!connectRef.current) {
      throw new Error('Ledger connect not initialized');
    }
    
    const connect = connectRef.current;
    await connect.ensureInitialized();
    
    try {
      const result = await operation(connect);
      await connect.ensureClosed();
      return result;
    } catch (error) {
      await connect.ensureClosed();
      throw error;
    }
  };

  const connectLedger = async () => {
    setConnectionState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));

    try {
      connectRef.current = new LedgerConnect();
      
      // Test connection
      await withLedgerConnection(async () => {
        return Promise.resolve();
      });

      setConnectionState(prev => ({
        ...prev,
        isConnected: true
      }));

      toast({
        title: 'Ledger Connected',
        description: 'Successfully connected to your Ledger device',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.log(err);
      const errorMessage = handleLedgerError(err);
      setConnectionState(prev => ({
        ...prev,
        error: errorMessage,
        isConnected: false
      }));
    } finally {
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false
      }));
    }
  };

  const importAccountAtIndex = async (index: number) => {
    setConnectionState(prev => ({ ...prev, error: null }));

    try {
      const ledgerAccount = await withLedgerConnection(async (connect) => {
        return await connect.getSS58Address(index, 42);
      });

      const hardwareAccount: HardwareAccount = {
        source: HardwareSource.Ledger,
        address: ledgerAccount.address,
        pubkey: ledgerAccount.publicKey,
        index: ledgerAccount.index,
        name: `Ledger Account #${index}`
      };

      // Check if account already exists
      const existingIndex = hardwareAccounts.findIndex(acc => acc.address === hardwareAccount.address);
      if (existingIndex !== -1) {
        toast({
          title: 'Account Already Imported',
          description: `Account #${index} is already in your list`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const updatedAccounts = [...hardwareAccounts, hardwareAccount];
      saveAccounts(updatedAccounts);

      // Update current index for next import
      const ledgerAccounts = updatedAccounts.filter(acc => acc.source === HardwareSource.Ledger);
      const maxIndex = Math.max(...ledgerAccounts.map(acc => acc.index));
      setConnectionState(prev => ({ ...prev, currentIndex: maxIndex + 1 }));

      toast({
        title: 'Account Imported',
        description: `Successfully imported account #${index}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.log(err);
      const errorMessage = handleLedgerError(err);
      setConnectionState(prev => ({ ...prev, error: errorMessage }));
      throw err;
    }
  };

  const importNextAccount = async () => {
    if (!connectionState.isConnected) {
      throw new Error('Ledger not connected');
    }
    await importAccountAtIndex(connectionState.currentIndex);
  };

  const removeAccount = (address: string) => {
    const updatedAccounts = hardwareAccounts.filter(acc => acc.address !== address);
    saveAccounts(updatedAccounts);
    
    toast({
      title: 'Account Removed',
      description: 'Hardware account removed from your list',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const updateAccountName = (address: string, name: string) => {
    const updatedAccounts = hardwareAccounts.map(acc => 
      acc.address === address ? { ...acc, name } : acc
    );
    saveAccounts(updatedAccounts);
    
    toast({
      title: 'Account Updated',
      description: 'Account name updated successfully',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const disconnectLedger = async () => {
    if (connectRef.current) {
      try {
        await connectRef.current.ensureClosed();
      } catch (error) {
        console.warn('Error closing Ledger connection:', error);
      }
      connectRef.current = null;
    }

    setConnectionState({
      isConnecting: false,
      isConnected: false,
      error: null,
      currentIndex: connectionState.currentIndex
    });
  };

  const retryConnection = async () => {
    await disconnectLedger();
    await connectLedger();
  };

  const clearAllAccounts = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear hardware accounts from localStorage:', error);
    }
    
    setHardwareAccounts([]);
    setConnectionState(prev => ({ ...prev, currentIndex: 0 }));
    
    toast({
      title: 'All Accounts Cleared',
      description: 'All hardware accounts have been removed',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const contextValue: LedgerConnectContextType = {
    hardwareAccounts,
    connectionState,
    connectLedger,
    importNextAccount,
    importAccountAtIndex,
    removeAccount,
    updateAccountName,
    disconnectLedger,
    retryConnection,
    clearAllAccounts
  };

  return (
    <LedgerConnectContext.Provider value={contextValue}>
      {children}
    </LedgerConnectContext.Provider>
  );
};