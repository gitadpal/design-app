export type LoginMethod = 'apple' | 'email' | 'passkey' | 'wallet';

export type WalletClientType = 'privy' | 'walletconnect';

export interface LinkedAccount {
  type: 'apple_oauth' | 'email' | 'passkey' | 'wallet';
  subject?: string;
  email?: string;
  address?: string;
  linkedAt: number;
}

export interface User {
  id: string;
  createdAt: number;
  linkedAccounts: LinkedAccount[];
  email?: { address: string };
  apple?: { subject: string; email?: string };
}

export interface ConnectedWallet {
  address: string;
  chainId: string;
  walletClientType: WalletClientType;
  connectorType: string;
  linkedAt: number;
}

export interface AuthAppearance {
  theme?: 'light' | 'dark';
  accentColor?: string;
  logo?: string;
}

export interface EmbeddedWalletsConfig {
  createOnLogin?: 'users-without-wallets' | 'all-users' | 'off';
}

export interface AuthConfig {
  loginMethods: LoginMethod[];
  embeddedWallets?: EmbeddedWalletsConfig;
  appearance?: AuthAppearance;
}

export interface SignMessageResult {
  signature: string;
}

export interface LoginOptions {
  loginMethod?: LoginMethod;
}
