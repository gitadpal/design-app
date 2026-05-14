import { useContext } from 'react';
import { AuthContext } from './provider';
import type { ConnectedWallet, LoginOptions, SignMessageResult, User } from './types';

function useCtx() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider missing from component tree');
  return ctx;
}

export interface UsePrivyResult {
  ready: boolean;
  authenticated: boolean;
  user: User | null;
  login: (options?: LoginOptions) => void;
  logout: () => void;
  connectWallet: () => void;
}

export function usePrivy(): UsePrivyResult {
  const { ready, authenticated, user, login, logout, connectWallet } = useCtx();
  return { ready, authenticated, user, login, logout, connectWallet };
}

export interface UseWalletsResult {
  ready: boolean;
  wallets: ConnectedWallet[];
  activeWallet: ConnectedWallet | null;
  switchWallet: () => void;
}

export function useWallets(): UseWalletsResult {
  const { ready, wallets, activeWalletAddress, switchWallet } = useCtx();
  const activeWallet = wallets.find((w: ConnectedWallet) => w.address === activeWalletAddress) ?? null;
  return { ready, wallets, activeWallet, switchWallet };
}

export interface UseLoginResult {
  login: (options?: LoginOptions) => void;
}

export function useLogin(): UseLoginResult {
  const { login } = useCtx();
  return { login };
}

export interface UseConnectWalletResult {
  connectWallet: () => void;
}

export function useConnectWallet(): UseConnectWalletResult {
  const { connectWallet } = useCtx();
  return { connectWallet };
}

export interface UseSignMessageResult {
  signMessage: (message: string) => Promise<SignMessageResult>;
}

export function useSignMessage(): UseSignMessageResult {
  const { signMessage } = useCtx();
  return { signMessage };
}
