import { atom } from 'jotai';
import {
  availableWalletsAtom,
  connectedAccountAtom,
  connectedWalletIdsAtom,
  externalSignerAtom,
  WalletConnection,
  walletConnectionsAtomFamily,
} from './walletAtoms.js';
import { InjectedSigner, TypinkAccount } from '../types.js';
import { Wallet } from '../wallets/index.js';
import { assert } from 'dedot/utils';
import { transformInjectedToTypinkAccounts } from '../utils/index.js';

// Atom for app name (set during provider initialization)
export const appNameAtom = atom<string>('');

// Write-only atom for connecting a wallet
export const connectWalletAtom = atom(null, async (get, set, walletId: string) => {
  const walletIds = get(connectedWalletIdsAtom);
  const availableWallets = get(availableWalletsAtom);
  const appName = get(appNameAtom);

  try {
    const targetWallet = availableWallets.find((w) => w.id === walletId);
    assert(targetWallet, `Wallet Id Not Found ${walletId}`);

    await targetWallet.waitUntilReady();
    const injectedProvider = targetWallet.injectedProvider;
    assert(injectedProvider?.enable, `Invalid Wallet: ${targetWallet.id}`);

    const injected = await injectedProvider.enable(appName);
    const initialConnectedAccounts = await injected.accounts.get();

    if (initialConnectedAccounts.length === 0) {
      console.warn(`No accounts found for wallet: ${walletId}`);
      return;
    }

    const typinkAccounts = transformInjectedToTypinkAccounts(initialConnectedAccounts, walletId);

    // Create subscription for this wallet with account validation
    const subscription = injected.accounts.subscribe((injectedAccounts) => {
      const updatedTypinkAccounts = transformInjectedToTypinkAccounts(injectedAccounts, walletId);

      // Update the wallet connection with new accounts
      const currentConnectionAtom = walletConnectionsAtomFamily(walletId);
      const currentConnection = get(currentConnectionAtom);
      if (currentConnection) {
        set(currentConnectionAtom, {
          ...currentConnection,
          accounts: updatedTypinkAccounts,
        });
      }

      // Check if the currently connected account is still valid (only for this wallet)
      const connectedAccount = get(connectedAccountAtom);
      if (connectedAccount && connectedAccount.source === walletId) {
        // Only check if the connected account belongs to this wallet
        const accountStillExists = updatedTypinkAccounts.some(
          (account) => account.address === connectedAccount.address,
        );

        if (!accountStillExists) {
          console.log(
            `Connected account ${connectedAccount.address} is no longer available in wallet ${walletId}, resetting...`,
          );
          set(connectedAccountAtom, undefined);
        }
      }
    });

    const connection: WalletConnection = {
      walletId,
      wallet: targetWallet,
      signer: injected.signer as any,
      accounts: typinkAccounts,
      subscription,
    };

    // Store the connection
    const connectionAtom = walletConnectionsAtomFamily(walletId);
    set(connectionAtom, connection);

    // Add to connected wallet IDs
    set(connectedWalletIdsAtom, Array.from(new Set([...walletIds, walletId])));
  } catch (e) {
    console.error(`Error while connecting wallet ${walletId}:`, e);
    throw e;
  }
});

// Write-only atom for disconnecting wallet(s)
export const disconnectWalletAtom = atom(null, (get, set, walletId?: string) => {
  const walletIds = get(connectedWalletIdsAtom);
  const connectedAccount = get(connectedAccountAtom);

  if (walletId) {
    // Disconnect specific wallet
    const connectionAtom = walletConnectionsAtomFamily(walletId);
    const connection = get(connectionAtom);

    // Clean up subscription
    if (connection?.subscription) {
      connection.subscription();
    }

    // Remove connection
    set(connectionAtom, null);

    // Update connected wallet IDs
    const newWalletIds = walletIds.filter((id) => id !== walletId);
    set(connectedWalletIdsAtom, newWalletIds);

    // Check if the connected account belongs to the disconnected wallet
    if (connectedAccount?.source === walletId) {
      set(connectedAccountAtom, undefined);
    }
  } else {
    // Disconnect all wallets
    walletIds.forEach((id) => {
      const connectionAtom = walletConnectionsAtomFamily(id);
      const connection = get(connectionAtom);
      if (connection?.subscription) {
        connection.subscription();
      }
      set(connectionAtom, null);
    });

    set(connectedWalletIdsAtom, []);
    set(connectedAccountAtom, undefined);
  }
});

// Write-only atom for setting connected account
export const setConnectedAccountAtom = atom(null, (_get, set, account: TypinkAccount) => {
  set(connectedAccountAtom, account);
});

// Initialization atom for setting available wallets
export const initializeWalletsAtom = atom(null, (_get, set, wallets: Wallet[]) => {
  set(availableWalletsAtom, wallets);
});

// Initialization atom for setting app name
export const initializeAppNameAtom = atom(null, (_get, set, appName: string) => {
  set(appNameAtom, appName);
});

// Write-only atom for setting external signer
export const setExternalSignerAtom = atom(null, (_get, set, signer: InjectedSigner | undefined) => {
  set(externalSignerAtom, signer);
});
