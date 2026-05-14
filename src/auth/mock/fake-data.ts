import type { LoginMethod, User, ConnectedWallet, LinkedAccount } from '../types';

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deterministicHex(seed: string, bytes: number): string {
  const out: string[] = [];
  let h = hashString(seed);
  while (out.length < bytes) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = (h ^ (h >>> 16)) >>> 0;
    out.push(((h >>> 0) & 0xff).toString(16).padStart(2, '0'));
    h = Math.imul(h ^ 0x9e3779b9, 2654435761) >>> 0;
  }
  return out.slice(0, bytes).join('');
}

export function fakeUserId(method: LoginMethod, identifier: string): string {
  return `did:mock:${method}:${deterministicHex(`${method}:${identifier}`, 8)}`;
}

export function fakeEthAddress(seed: string): string {
  return `0x${deterministicHex(seed, 20)}`;
}

export function fakeWcUri(): string {
  const topic = deterministicHex(`wc:${Date.now()}:${Math.random()}`, 32);
  const key = deterministicHex(`key:${Date.now()}:${Math.random()}`, 32);
  return `wc:${topic}@2?relay-protocol=irn&symKey=${key}`;
}

export function buildUser(method: LoginMethod, identifier: string): User {
  const id = fakeUserId(method, identifier);
  const linkedAt = Date.now();
  const linkedAccounts: LinkedAccount[] = [];

  const user: User = {
    id,
    createdAt: linkedAt,
    linkedAccounts,
  };

  switch (method) {
    case 'apple':
      user.apple = { subject: identifier };
      linkedAccounts.push({ type: 'apple_oauth', subject: identifier, linkedAt });
      break;
    case 'email':
      user.email = { address: identifier };
      linkedAccounts.push({ type: 'email', email: identifier, linkedAt });
      break;
    case 'passkey':
      linkedAccounts.push({ type: 'passkey', subject: identifier, linkedAt });
      break;
    case 'wallet':
      linkedAccounts.push({ type: 'wallet', address: identifier, linkedAt });
      break;
  }

  return user;
}

export function buildEmbeddedWallet(userId: string): ConnectedWallet {
  return {
    address: fakeEthAddress(`embedded:${userId}`),
    chainId: 'eip155:1',
    walletClientType: 'privy',
    connectorType: 'embedded',
    linkedAt: Date.now(),
  };
}

export function buildExternalWallet(address: string): ConnectedWallet {
  return {
    address,
    chainId: 'eip155:1',
    walletClientType: 'walletconnect',
    connectorType: 'wallet_connect',
    linkedAt: Date.now(),
  };
}
