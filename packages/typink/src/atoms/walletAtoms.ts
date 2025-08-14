import { atom } from 'jotai';
import { atomWithStorage, atomFamily } from 'jotai/utils';
import { InjectedSigner, TypinkAccount } from '../types.js';
import { Wallet } from '../wallets/index.js';

// Data structures for multi-wallet management
export interface WalletConnection {
  walletId: string;
  wallet: Wallet;
  signer: InjectedSigner;
  accounts: TypinkAccount[];
  subscription?: () => void;
}

// Atom family for managing individual wallet connections
// Key is walletId, value is WalletConnection or null
export const walletConnectionsAtomFamily = atomFamily((_: string) => atom<WalletConnection | null>(null));

// Persistent atom for tracking connected wallet IDs
export const connectedWalletIdsAtom = atomWithStorage<string[]>(
  'TYPINK::CONNECTED_WALLETS', //--
  [],
  undefined,
  { getOnInit: true },
);

// Persistent atom for the currently selected account
export const connectedAccountAtom = atomWithStorage<TypinkAccount | undefined>(
  'TYPINK::CONNECTED_ACCOUNT',
  undefined,
  undefined,
  { getOnInit: true },
);

// Derived atom for getting all wallet connections
export const allWalletConnectionsAtom = atom((get) => {
  const walletIds = get(connectedWalletIdsAtom);
  const connections = new Map<string, WalletConnection>();

  walletIds.forEach((id) => {
    const connectionAtom = walletConnectionsAtomFamily(id);
    const connection = get(connectionAtom);
    if (connection) {
      connections.set(id, connection);
    }
  });

  return connections;
});

// Derived atom for all accounts from all connected wallets
export const allAccountsAtom = atom((get) => {
  const connections = get(allWalletConnectionsAtom);
  return Array.from(connections.values()).flatMap((conn) => conn.accounts);
});

// Smart signer atom that considers the connected account's wallet
export const effectiveSignerAtom = atom<InjectedSigner | undefined>((get) => {
  const connectedAccount = get(connectedAccountAtom);
  const walletConnections = get(allWalletConnectionsAtom);

  if (connectedAccount) {
    // Use signer from the wallet that owns the connected account
    const accountWallet = walletConnections.get(connectedAccount.source);
    if (accountWallet?.signer) {
      return accountWallet.signer;
    }
  }

  return undefined;
});

// Atom for external signer (from props or external wallet connectors)
export const externalSignerAtom = atom<InjectedSigner | undefined>(undefined);

// Final effective signer atom that considers external signer priority
export const finalEffectiveSignerAtom = atom<InjectedSigner | undefined>((get) => {
  const externalSigner = get(externalSignerAtom);
  const accountBasedSigner = get(effectiveSignerAtom);

  // External signer takes precedence over account-based signer
  return externalSigner || accountBasedSigner;
});

// Available wallets atom (can be set during provider initialization)
export const availableWalletsAtom = atom<Wallet[]>([]);

// Derived atom for connected wallets
export const connectedWalletsAtom = atom((get) => {
  const walletIds = get(connectedWalletIdsAtom);
  const availableWallets = get(availableWalletsAtom);

  return walletIds.map((id) => availableWallets.find((w) => w.id === id)).filter(Boolean) as Wallet[];
});
