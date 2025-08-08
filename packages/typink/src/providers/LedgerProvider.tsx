import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { LedgerConnect } from '../signers';
import { TypinkAccount } from '../types.js';

export interface LedgerConnectionState {
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  currentIndex: number;
}

const STORAGE_KEY = 'TYPINK::LEDGER::ACCOUNTS';

// Standalone utility functions for ledger account storage
export const getStoredLedgerAccounts = (): TypinkAccount[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load hardware accounts from localStorage:', error);
    return [];
  }
};

export const saveLedgerAccounts = (accounts: TypinkAccount[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.warn('Failed to save hardware accounts to localStorage:', error);
  }
};

interface LedgerContextType {
  // State
  ledgerAccounts: TypinkAccount[];
  connectionState: LedgerConnectionState;

  // Core methods
  connectLedger: () => Promise<void>;
  importAccountAtIndex: (index: number) => Promise<TypinkAccount>;
  importNextAccount: () => Promise<TypinkAccount>;
  removeAccount: (address: string) => void;
  updateAccountName: (address: string, name: string) => void;
  disconnectLedger: () => Promise<void>;
  retryConnection: () => Promise<void>;
  clearAllAccounts: () => void;
}

const LedgerContext = createContext<LedgerContextType | null>(null);

export const useLedger = () => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
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

interface LedgerProviderProps {
  children: ReactNode;
}

export const LedgerProvider: React.FC<LedgerProviderProps> = ({ children }) => {
  // Initialize with stored accounts immediately
  const [ledgerAccounts, setLedgerAccounts] = useState<TypinkAccount[]>(() => getStoredLedgerAccounts());
  
  // Calculate initial current index based on stored accounts
  const initialStoredAccounts = getStoredLedgerAccounts();
  const initialCurrentIndex = initialStoredAccounts.length > 0 ? Math.max(...initialStoredAccounts.map((acc) => acc.index!)) + 1 : 0;
  
  const [connectionState, setConnectionState] = useState<LedgerConnectionState>({
    isConnecting: false,
    isConnected: false,
    error: null,
    currentIndex: initialCurrentIndex,
  });

  const connectRef = useRef<LedgerConnect | null>(null);

  // No longer need useEffect to initialize - accounts are loaded immediately in state initializer

  const saveAccounts = (accounts: TypinkAccount[]) => {
    // Save to localStorage using external utility
    saveLedgerAccounts(accounts);
    // Update local state
    setLedgerAccounts(accounts);
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
    setConnectionState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      connectRef.current = new LedgerConnect();

      // Test connection
      await withLedgerConnection(async () => {
        return Promise.resolve();
      });

      setConnectionState((prev) => ({
        ...prev,
        isConnected: true,
      }));
    } catch (err) {
      console.log(err);
      const errorMessage = handleLedgerError(err);
      setConnectionState((prev) => ({
        ...prev,
        error: errorMessage,
        isConnected: false,
      }));
      throw err;
    } finally {
      setConnectionState((prev) => ({
        ...prev,
        isConnecting: false,
      }));
    }
  };

  const importAccountAtIndex = async (index: number): Promise<TypinkAccount> => {
    setConnectionState((prev) => ({ ...prev, error: null }));

    try {
      const ledgerAccount = await withLedgerConnection(async (connect) => {
        return await connect.getSS58Address(index, 42);
      });

      const typinkAccount: TypinkAccount = {
        walletId: 'ledger',
        source: 'hardware',
        address: ledgerAccount.address,
        pubkey: ledgerAccount.publicKey,
        index: ledgerAccount.index,
        name: `Ledger Account #${index}`,
      };

      // Check if account already exists
      const existingIndex = ledgerAccounts.findIndex((acc) => acc.address === typinkAccount.address);
      if (existingIndex !== -1) {
        throw new Error(`Account #${index} is already imported`);
      }

      const updatedAccounts = [...ledgerAccounts, typinkAccount];
      saveAccounts(updatedAccounts);

      // Update current index for next import
      const maxIndex = Math.max(...updatedAccounts.map((acc) => acc.index!));
      setConnectionState((prev) => ({ ...prev, currentIndex: maxIndex + 1 }));

      return typinkAccount;
    } catch (err) {
      console.log(err);
      const errorMessage = handleLedgerError(err);
      setConnectionState((prev) => ({ ...prev, error: errorMessage }));
      throw err;
    }
  };

  const importNextAccount = async (): Promise<TypinkAccount> => {
    if (!connectionState.isConnected) {
      throw new Error('Ledger not connected');
    }
    return await importAccountAtIndex(connectionState.currentIndex);
  };

  const removeAccount = (address: string) => {
    const updatedAccounts = ledgerAccounts.filter((acc) => acc.address !== address);
    saveAccounts(updatedAccounts);
  };

  const updateAccountName = (address: string, name: string) => {
    const updatedAccounts = ledgerAccounts.map((acc) => (acc.address === address ? { ...acc, name } : acc));
    saveAccounts(updatedAccounts);
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
      currentIndex: connectionState.currentIndex,
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

    setLedgerAccounts([]);
    setConnectionState((prev) => ({ ...prev, currentIndex: 0 }));
  };

  const contextValue: LedgerContextType = {
    ledgerAccounts,
    connectionState,
    connectLedger,
    importAccountAtIndex,
    importNextAccount,
    removeAccount,
    updateAccountName,
    disconnectLedger,
    retryConnection,
    clearAllAccounts,
  };

  return <LedgerContext.Provider value={contextValue}>{children}</LedgerContext.Provider>;
};
