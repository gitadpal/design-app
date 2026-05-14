import type { User, ConnectedWallet } from '../types';

const KEYS = {
  user: 'adpal.mock.user',
  wallets: 'adpal.mock.wallets',
  activeWallet: 'adpal.mock.activeWallet',
} as const;

export interface PersistedState {
  user: User | null;
  wallets: ConnectedWallet[];
  activeWalletAddress: string | null;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadState(): PersistedState {
  if (typeof window === 'undefined') {
    return { user: null, wallets: [], activeWalletAddress: null };
  }
  return {
    user: safeParse<User>(localStorage.getItem(KEYS.user)),
    wallets: safeParse<ConnectedWallet[]>(localStorage.getItem(KEYS.wallets)) ?? [],
    activeWalletAddress: localStorage.getItem(KEYS.activeWallet),
  };
}

export function saveUser(user: User | null): void {
  if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
  else localStorage.removeItem(KEYS.user);
}

export function saveWallets(wallets: ConnectedWallet[]): void {
  localStorage.setItem(KEYS.wallets, JSON.stringify(wallets));
}

export function saveActiveWallet(address: string | null): void {
  if (address) localStorage.setItem(KEYS.activeWallet, address);
  else localStorage.removeItem(KEYS.activeWallet);
}

export function clearAll(): void {
  localStorage.removeItem(KEYS.user);
  localStorage.removeItem(KEYS.wallets);
  localStorage.removeItem(KEYS.activeWallet);
}
