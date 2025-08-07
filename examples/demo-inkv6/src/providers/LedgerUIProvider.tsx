import React, { createContext, useContext, ReactNode } from 'react';
import { useToast } from '@chakra-ui/react';
import { useLedger, type HardwareAccount, type LedgerConnectionState } from 'typink';

interface LedgerUIContextType {
  // State from core provider
  hardwareAccounts: HardwareAccount[];
  connectionState: LedgerConnectionState;

  // UI-enhanced methods with toasts and error handling
  connectLedger: () => Promise<void>;
  importNextAccount: () => Promise<void>;
  importAccountAtIndex: (index: number) => Promise<void>;
  removeAccount: (address: string) => void;
  updateAccountName: (address: string, name: string) => void;
  clearAllAccounts: () => void;
  retryConnection: () => Promise<void>;
}

const LedgerUIContext = createContext<LedgerUIContextType | null>(null);

export const useLedgerUI = () => {
  const context = useContext(LedgerUIContext);
  if (!context) {
    throw new Error('useLedgerUI must be used within a LedgerUIProvider');
  }
  return context;
};

interface LedgerUIProviderProps {
  children: ReactNode;
}

export const LedgerUIProvider: React.FC<LedgerUIProviderProps> = ({ children }) => {
  const ledgerContext = useLedger();
  const toast = useToast();

  const connectLedger = async () => {
    try {
      await ledgerContext.connectLedger();
      toast({
        title: 'Ledger Connected',
        description: 'Successfully connected to your Ledger device',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      // Error is already handled in core provider
      console.log('Connect ledger failed:', error);
    }
  };

  const importNextAccount = async () => {
    try {
      const account = await ledgerContext.importNextAccount();
      toast({
        title: 'Account Imported',
        description: `Successfully imported account #${account.index}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.log('Import account failed:', error);
    }
  };

  const importAccountAtIndex = async (index: number) => {
    try {
      const account = await ledgerContext.importAccountAtIndex(index);
      toast({
        title: 'Account Imported',
        description: `Successfully imported account #${account.index}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('already imported')) {
        toast({
          title: 'Account Already Imported',
          description: `Account #${index} is already in your list`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
      console.log('Import account failed:', error);
    }
  };

  const removeAccount = (address: string) => {
    ledgerContext.removeAccount(address);
    toast({
      title: 'Account Removed',
      description: 'Hardware account removed from your list',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const updateAccountName = (address: string, name: string) => {
    ledgerContext.updateAccountName(address, name);
    toast({
      title: 'Account Updated',
      description: 'Account name updated successfully',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const clearAllAccounts = () => {
    ledgerContext.clearAllAccounts();
    toast({
      title: 'All Accounts Cleared',
      description: 'All hardware accounts have been removed',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const retryConnection = async () => {
    try {
      await ledgerContext.retryConnection();
      toast({
        title: 'Connection Retry',
        description: 'Attempting to reconnect to Ledger device',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.log('Retry connection failed:', error);
    }
  };

  const contextValue: LedgerUIContextType = {
    hardwareAccounts: ledgerContext.hardwareAccounts,
    connectionState: ledgerContext.connectionState,
    connectLedger,
    importNextAccount,
    importAccountAtIndex,
    removeAccount,
    updateAccountName,
    clearAllAccounts,
    retryConnection,
  };

  return <LedgerUIContext.Provider value={contextValue}>{children}</LedgerUIContext.Provider>;
};
