# Multi-Wallet Support - Usage Guide

The enhanced TypinkProvider now supports connecting to multiple wallets simultaneously while maintaining full backward compatibility.

## New Multi-Wallet API

```typescript
interface WalletSetupContextProps {
  // Multi-wallet support
  connectWallet: (id: string) => Promise<void>;
  disconnect: (walletId?: string) => void;
  connectedWalletIds: string[];
  connectedWallets: Wallet[];
  accounts: TypinkAccount[];
  
  // Utility functions
  getAccountsByWallet: (walletId: string) => TypinkAccount[];
  isWalletConnected: (walletId: string) => boolean;
  
}
```

## Basic Usage Examples

### 1. Connect Multiple Wallets

```typescript
import { useTypink } from 'typink';

function MultiWalletConnection() {
  const { connectWallet, connectedWalletIds, accounts } = useTypink();

  const handleConnectWallet = async (walletId: string) => {
    try {
      await connectWallet(walletId);
      console.log(`Connected to ${walletId}`);
    } catch (error) {
      console.error(`Failed to connect to ${walletId}:`, error);
    }
  };

  return (
    <div>
      <h2>Multi-Wallet Connection</h2>
      
      <button onClick={() => handleConnectWallet('subwallet-js')}>
        Connect SubWallet
      </button>
      <button onClick={() => handleConnectWallet('talisman')}>
        Connect Talisman
      </button>
      <button onClick={() => handleConnectWallet('polkadot-js')}>
        Connect Polkadot.js
      </button>

      <p>Connected Wallets: {connectedWalletIds.join(', ')}</p>
      <p>Total Accounts: {accounts.length}</p>
    </div>
  );
}
```

### 2. Account Management Across Wallets

```typescript
function AccountManager() {
  const { 
    accounts, 
    connectedWalletIds, 
    getAccountsByWallet,
    isWalletConnected 
  } = useTypink();

  return (
    <div>
      <h2>All Accounts ({accounts.length})</h2>
      {accounts.map((account, index) => (
        <div key={`${account.source}-${account.address}`} className="account-item">
          <strong>{account.name || `Account ${index + 1}`}</strong>
          <br />
          <small>
            Address: {account.address}
            <br />
            Wallet: {account.source}
            <br />
            Type: {account.type || 'Unknown'}
          </small>
        </div>
      ))}

      <h3>Accounts by Wallet</h3>
      {connectedWalletIds.map(walletId => {
        const walletAccounts = getAccountsByWallet(walletId);
        return (
          <div key={walletId}>
            <h4>{walletId} ({walletAccounts.length} accounts)</h4>
            {walletAccounts.map(account => (
              <div key={account.address}>
                • {account.name} - {account.address.slice(0, 10)}...
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
```

### 3. Selective Wallet Disconnection

```typescript
function WalletManager() {
  const { 
    connectedWalletIds, 
    connectedWallets,
    disconnect, 
    isWalletConnected 
  } = useTypink();

  const handleDisconnectWallet = (walletId: string) => {
    disconnect(walletId); // Disconnect specific wallet
    console.log(`Disconnected from ${walletId}`);
  };

  const handleDisconnectAll = () => {
    disconnect(); // Disconnect all wallets
    console.log('Disconnected from all wallets');
  };

  return (
    <div>
      <h2>Connected Wallets</h2>
      
      {connectedWallets.map(wallet => (
        <div key={wallet.id} className="wallet-item">
          <span>{wallet.name}</span>
          <button onClick={() => handleDisconnectWallet(wallet.id)}>
            Disconnect
          </button>
        </div>
      ))}

      {connectedWalletIds.length > 0 && (
        <button onClick={handleDisconnectAll}>
          Disconnect All Wallets
        </button>
      )}

      <h3>Wallet Status Check</h3>
      <p>SubWallet: {isWalletConnected('subwallet-js') ? '✅' : '❌'}</p>
      <p>Talisman: {isWalletConnected('talisman') ? '✅' : '❌'}</p>
      <p>Polkadot.js: {isWalletConnected('polkadot-js') ? '✅' : '❌'}</p>
    </div>
  );
}
```

### 4. Account Selection with Multi-Wallet Support

```typescript
function EnhancedAccountSelection() {
  const { 
    accounts, 
    connectedAccount,
    setConnectedAccount,
    getAccountsByWallet 
  } = useTypink();

  const handleSelectAccount = (account: TypinkAccount) => {
    setConnectedAccount(account);
  };

  const groupedAccounts = accounts.reduce((groups, account) => {
    if (!groups[account.source]) {
      groups[account.source] = [];
    }
    groups[account.source].push(account);
    return groups;
  }, {} as Record<string, TypinkAccount[]>);

  return (
    <div>
      <h2>Account Selection</h2>
      
      {connectedAccount && (
        <div className="selected-account">
          <h3>Selected Account</h3>
          <p><strong>{connectedAccount.name}</strong></p>
          <p>Address: {connectedAccount.address}</p>
          <p>Wallet: {connectedAccount.source}</p>
        </div>
      )}

      <h3>Available Accounts</h3>
      {Object.entries(groupedAccounts).map(([walletId, walletAccounts]) => (
        <div key={walletId} className="wallet-group">
          <h4>{walletId} Accounts</h4>
          {walletAccounts.map(account => (
            <div 
              key={account.address}
              className={`account-option ${connectedAccount?.address === account.address ? 'selected' : ''}`}
              onClick={() => handleSelectAccount(account)}
            >
              <strong>{account.name || 'Unnamed Account'}</strong>
              <br />
              <small>{account.address}</small>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 5. Accessing Primary Wallet

```typescript
function PrimaryWalletComponent() {
  const { 
    connectedWalletIds,
    connectedWallets,
    accounts,
  } = useTypink();

  // Access first connected wallet (primary)
  const primaryWalletId = connectedWalletIds[0];
  const primaryWallet = connectedWallets[0];

  return (
    <div>
      <h2>Primary Wallet Access</h2>
      
      {/* Access first wallet from arrays */}
      <p>Primary Wallet: {primaryWallet?.name || 'None'}</p>
      <p>Primary Wallet ID: {primaryWalletId || 'None'}</p>
      
      {/* Multi-wallet features */}
      <p>All Connected Wallets: {connectedWalletIds.length}</p>
      <p>Total Accounts: {accounts.length}</p>
    </div>
  );
}
```

## Advanced Usage Patterns

### Wallet-Specific Operations

```typescript
function WalletSpecificOperations() {
  const { accounts, getAccountsByWallet } = useTypink();

  const performWalletSpecificAction = (walletId: string) => {
    const walletAccounts = getAccountsByWallet(walletId);
    
    if (walletAccounts.length === 0) {
      console.log(`No accounts found for ${walletId}`);
      return;
    }

    // Perform operations with accounts from specific wallet
    walletAccounts.forEach(account => {
      console.log(`Processing account ${account.name} from ${walletId}`);
      // Your wallet-specific logic here
    });
  };

  return (
    <div>
      <button onClick={() => performWalletSpecificAction('subwallet-js')}>
        Process SubWallet Accounts
      </button>
      <button onClick={() => performWalletSpecificAction('talisman')}>
        Process Talisman Accounts
      </button>
    </div>
  );
}
```

### Real-time Multi-Wallet Status

```typescript
function MultiWalletStatus() {
  const { 
    connectedWalletIds, 
    accounts,
    isWalletConnected,
    getAccountsByWallet 
  } = useTypink();

  const walletTypes = ['subwallet-js', 'talisman', 'polkadot-js'];

  return (
    <div>
      <h2>Multi-Wallet Status Dashboard</h2>
      
      <div className="status-grid">
        {walletTypes.map(walletId => {
          const isConnected = isWalletConnected(walletId);
          const accountCount = isConnected ? getAccountsByWallet(walletId).length : 0;
          
          return (
            <div key={walletId} className={`wallet-status ${isConnected ? 'connected' : 'disconnected'}`}>
              <h3>{walletId}</h3>
              <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
              {isConnected && <p>Accounts: {accountCount}</p>}
            </div>
          );
        })}
      </div>

      <div className="summary">
        <h3>Summary</h3>
        <p>Connected Wallets: {connectedWalletIds.length}</p>
        <p>Total Accounts: {accounts.length}</p>
        <p>Account Sources: {[...new Set(accounts.map(acc => acc.source))].join(', ')}</p>
      </div>
    </div>
  );
}
```

## Key Benefits

- ✅ **Multiple Wallet Connections**: Connect SubWallet, Talisman, and Polkadot.js simultaneously
- ✅ **Account Aggregation**: All accounts from all wallets available in one unified array
- ✅ **Source Tracking**: Each account knows which wallet it comes from
- ✅ **Selective Management**: Connect/disconnect specific wallets independently
- ✅ **Utility Functions**: Helper functions for wallet-specific operations
- ✅ **Clean API**: Simple access to first wallet using array indexing
- ✅ **Type Safety**: Full TypeScript support for all new features

## Migration Guide

To migrate from the old single-wallet API to the new multi-wallet API:

```typescript
// Before (deprecated properties)
const { connectedWalletId, connectedWallet, accounts } = useTypink();

// After (new multi-wallet API)
const { 
  connectedWalletIds,    // Array of all connected wallets
  connectedWallets,      // Array of wallet objects
  getAccountsByWallet,   // Filter accounts by wallet
  isWalletConnected,     // Check wallet connection status
  accounts               // All accounts from all wallets
} = useTypink();

// Access primary wallet (equivalent to old connectedWalletId/connectedWallet)
const primaryWalletId = connectedWalletIds[0];
const primaryWallet = connectedWallets[0];
```