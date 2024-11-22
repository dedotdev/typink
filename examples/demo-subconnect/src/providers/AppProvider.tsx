import { InjectedAccount, Props } from 'typink';
import { createContext, useContext, useEffect, useState } from 'react';
import { useConnectWallet } from '@subwallet-connect/react';

interface AppContextProps {
  connectedAccount?: InjectedAccount;
  setConnectedAccount: (account?: InjectedAccount) => void;
}

export const AppContext = createContext<AppContextProps>({} as any);

export const useApp = () => {
  return useContext(AppContext);
};

interface AppProviderProps extends Props {}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [connectedAccount, setConnectedAccount] = useState<InjectedAccount>();

  const [{ wallet }] = useConnectWallet();

  useEffect(() => {
    if (wallet) return;

    setConnectedAccount(undefined);
  }, [wallet]);

  return (
    <AppContext.Provider
      value={{
        connectedAccount,
        setConnectedAccount,
      }}>
      {children}
    </AppContext.Provider>
  );
};
