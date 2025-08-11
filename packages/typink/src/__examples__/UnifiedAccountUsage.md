# TypinkAccount - Unified Account Interface

The new `TypinkAccount` interface provides a unified way to handle accounts from all wallet sources, including extension wallets (SubWallet, Talisman, Polkadot.js) and future non-injected wallets (WalletConnect, Ledger, etc.).

## Interface Definition

```typescript
interface TypinkAccount extends InjectedAccount {
  source: string; // wallet id that the account is from
}

// InjectedAccount fields:
// - address: string
// - genesisHash?: string | null
// - name?: string  
// - type?: KeypairType ('ed25519' | 'sr25519' | 'ecdsa' | 'ethereum')
```

## Basic Usage

```typescript
import { useTypink, TypinkAccount } from 'typink';

function AccountSelection() {
  const { accounts, connectedAccount, connectWallet } = useTypink();

  return (
    <div>
      <h2>All Available Accounts</h2>
      {accounts.map((account: TypinkAccount) => (
        <div key={`${account.source}-${account.address}`}>
          <strong>{account.name || 'Unknown Account'}</strong>
          <br />
          <small>
            {account.address} (from {account.source})
          </small>
        </div>
      ))}

      {connectedAccount && (
        <div>
          <h3>Connected Account</h3>
          <p>Name: {connectedAccount.name}</p>
          <p>Address: {connectedAccount.address}</p>
          <p>Source: {connectedAccount.source}</p>
        </div>
      )}
    </div>
  );
}
```

## Filtering Accounts by Wallet Source

```typescript
function filterAccountsByWallet(accounts: TypinkAccount[], walletId: string): TypinkAccount[] {
  return accounts.filter(account => account.source === walletId);
}

// Usage
const { accounts } = useTypink();
const subwalletAccounts = filterAccountsByWallet(accounts, 'subwallet-js');
const talismanAccounts = filterAccountsByWallet(accounts, 'talisman');
const polkadotJsAccounts = filterAccountsByWallet(accounts, 'polkadot-js');
```

## Grouping Accounts by Wallet Type

```typescript
function getAccountsByWalletType(accounts: TypinkAccount[]): Record<string, TypinkAccount[]> {
  return accounts.reduce((grouped, account) => {
    if (!grouped[account.source]) {
      grouped[account.source] = [];
    }
    grouped[account.source].push(account);
    return grouped;
  }, {} as Record<string, TypinkAccount[]>);
}

// Usage
const { accounts } = useTypink();
const groupedAccounts = getAccountsByWalletType(accounts);
console.log(groupedAccounts);
// Output: {
//   'subwallet-js': [...],
//   'talisman': [...], 
//   'polkadot-js': [...]
// }
```

## Future Wallet Support

The unified interface is ready for future wallet integrations:

```typescript
// Future WalletConnect accounts will have:
// { address: '...', name: '...', source: 'walletconnect' }

// Future Ledger accounts will have: 
// { address: '...', name: '...', source: 'ledger', type: 'ed25519' }

// Handling mixed wallet sources
function handleMixedWalletSources(accounts: TypinkAccount[]) {
  const extensionAccounts = accounts.filter(acc => 
    ['subwallet-js', 'talisman', 'polkadot-js'].includes(acc.source)
  );
  
  const walletConnectAccounts = accounts.filter(acc => 
    acc.source === 'walletconnect'
  );
  
  const ledgerAccounts = accounts.filter(acc => 
    acc.source === 'ledger'
  );

  return {
    extensionAccounts,
    walletConnectAccounts, 
    ledgerAccounts
  };
}
```

## Key Benefits

1. **Unified Interface**: Single account type for all wallets
2. **Source Tracking**: Know which wallet each account comes from
3. **Future-Ready**: Prepared for non-injected wallet integration
4. **Type Safety**: Full TypeScript support
5. **Clean API**: No backward compatibility complexity

## Migration Guide

If you were previously using `InjectedAccount[]`, simply replace it with `TypinkAccount[]`:

```typescript
// Before
const { injectedAccounts } = useTypink(); // ❌ No longer available

// After  
const { accounts } = useTypink(); // ✅ Use this instead
// accounts is now TypinkAccount[] with source property
```