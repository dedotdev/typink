import { InjectedAccount, Props } from 'typink';
import { createContext, useContext } from 'react';
import { useLocalStorage } from 'react-use';
import { useConnectWallet } from '@subwallet-connect/react';

interface AppContextProps {
  connectedAccount?: InjectedAccount;
  setConnectedAccount: (account?: InjectedAccount) => void;
  signOut: () => Promise<void>;
}

export const AppContext = createContext<AppContextProps>({} as any);

export const useApp = () => {
  return useContext(AppContext);
};

interface AppProviderProps extends Props {}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [{ wallet }, _, disconnect] = useConnectWallet();
  const [connectedAccount, setConnectedAccount, removeConnectedAccount] =
    useLocalStorage<InjectedAccount>('CONNECTED_ACCOUNT');

  const signOut = async () => {
    if (!wallet) return;

    await disconnect(wallet);
    removeConnectedAccount();
  };

  return (
    <AppContext.Provider
      value={{
        connectedAccount,
        setConnectedAccount,
        signOut,
      }}>
      {children}
    </AppContext.Provider>
  );
};
