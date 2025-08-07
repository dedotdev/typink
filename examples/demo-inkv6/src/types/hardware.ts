export enum HardwareSource {
  Ledger = 'ledger',
  Vault = 'vault',
  WalletConnect = 'walletconnect'
}

export interface HardwareAccount {
  source: HardwareSource;
  address: string;
  pubkey: string;
  index: number;
  name?: string;
}

export interface LedgerConnectionState {
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  currentIndex: number;
}