import { useSyncExternalStore } from 'react';
import { CIRCLE_ME } from '../../data/circleData';
import { chainIdFromLabel, type ChainId } from '../CampaignGallery/chainColors';

// Module-level store for the user's own receiving wallet — the address gifts and
// subscription payouts settle to. Seeded from CIRCLE_ME so a wallet is connected
// by default; the Wallet sheet in Circle settings lets the user replace the
// address / chain or remove it entirely, and every reader updates at once.
// In-memory only, matching the other Circle stores — no backend.

export interface Wallet {
  address: string;
  chain: ChainId;
}

// EVM address shape used to validate a pasted address before saving.
export const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

let wallet: Wallet | null = {
  address: CIRCLE_ME.walletAddress,
  chain: chainIdFromLabel(CIRCLE_ME.chain),
};
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

// Set or replace the connected wallet.
export function setWallet(next: Wallet): void {
  wallet = next;
  emit();
}

// Disconnect — leaves the account with no receiving wallet until one is re-set.
export function removeWallet(): void {
  wallet = null;
  emit();
}

function getWallet(): Wallet | null {
  return wallet;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useWallet(): Wallet | null {
  return useSyncExternalStore(subscribe, getWallet, getWallet);
}

// 0x1234…abcd — the compact form shown in list rows.
export function shortAddress(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
