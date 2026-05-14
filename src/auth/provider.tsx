import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  AuthConfig,
  ConnectedWallet,
  LoginMethod,
  LoginOptions,
  SignMessageResult,
  User,
} from './types';
import {
  loadState,
  saveUser,
  saveWallets,
  saveActiveWallet,
  clearAll,
} from './mock/state';
import {
  buildUser,
  buildEmbeddedWallet,
  buildExternalWallet,
} from './mock/fake-data';
import { createMockWcSession, type MockWcSession } from './mock/walletconnect';
import {
  enrollPasskey,
  requestBiometricSignature,
  generateFakeSignature,
} from './mock/biometric';
import {
  LoginPicker,
  EmailOtpFlow,
  AppleFlow,
  WalletConnectModal,
  BiometricOverlay,
  ExternalSignOverlay,
} from './mock/ui';

type LoginFlow =
  | { kind: 'idle' }
  | { kind: 'picker'; methods: LoginMethod[]; mode: 'login' | 'connect-wallet' | 'switch' }
  | { kind: 'apple' }
  | { kind: 'email' }
  | { kind: 'passkey-enroll'; identifier: string }
  | { kind: 'walletconnect'; session: MockWcSession };

type SignFlow =
  | { kind: 'idle' }
  | { kind: 'embedded'; message: string; resolve: (r: SignMessageResult) => void; reject: (e: Error) => void }
  | { kind: 'external'; message: string; resolve: (r: SignMessageResult) => void; reject: (e: Error) => void };

interface AuthContextValue {
  ready: boolean;
  authenticated: boolean;
  user: User | null;
  wallets: ConnectedWallet[];
  activeWalletAddress: string | null;
  config: AuthConfig;
  login: (options?: LoginOptions) => void;
  logout: () => void;
  connectWallet: () => void;
  signMessage: (message: string) => Promise<SignMessageResult>;
  switchWallet: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  config: AuthConfig;
  children: ReactNode;
}

export function AuthProvider({ config, children }: AuthProviderProps) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [wallets, setWallets] = useState<ConnectedWallet[]>([]);
  const [activeWalletAddress, setActiveWalletAddress] = useState<string | null>(null);
  const [loginFlow, setLoginFlow] = useState<LoginFlow>({ kind: 'idle' });
  const [signFlow, setSignFlow] = useState<SignFlow>({ kind: 'idle' });
  const [biometric, setBiometric] = useState<{ title: string; subtitle?: string } | null>(null);

  useEffect(() => {
    const persisted = loadState();
    setUser(persisted.user);
    setWallets(persisted.wallets);
    setActiveWalletAddress(persisted.activeWalletAddress);
    setReady(true);
  }, []);

  const persist = useCallback(
    (next: { user?: User | null; wallets?: ConnectedWallet[]; activeWallet?: string | null }) => {
      if (next.user !== undefined) {
        setUser(next.user);
        saveUser(next.user);
      }
      if (next.wallets !== undefined) {
        setWallets(next.wallets);
        saveWallets(next.wallets);
      }
      if (next.activeWallet !== undefined) {
        setActiveWalletAddress(next.activeWallet);
        saveActiveWallet(next.activeWallet);
      }
    },
    [],
  );

  const completeLogin = useCallback(
    async (method: LoginMethod, identifier: string, externalAddress?: string) => {
      const nextUser = buildUser(method, identifier);
      let nextWallet: ConnectedWallet;

      if (method === 'wallet' && externalAddress) {
        nextWallet = buildExternalWallet(externalAddress);
      } else {
        setBiometric({ title: 'Enroll Face ID', subtitle: 'Securing your AdPal wallet' });
        await enrollPasskey(nextUser.id, identifier);
        setBiometric(null);
        nextWallet = buildEmbeddedWallet(nextUser.id);
      }

      persist({
        user: nextUser,
        wallets: [nextWallet],
        activeWallet: nextWallet.address,
      });
      setLoginFlow({ kind: 'idle' });
    },
    [persist],
  );

  const handleMethodPick = useCallback(
    (method: LoginMethod) => {
      switch (method) {
        case 'apple':
          setLoginFlow({ kind: 'apple' });
          break;
        case 'email':
          setLoginFlow({ kind: 'email' });
          break;
        case 'passkey':
          void (async () => {
            setBiometric({ title: 'Sign in with passkey', subtitle: 'Confirm with Face ID' });
            const ok = await requestBiometricSignature();
            setBiometric(null);
            if (!ok) {
              setLoginFlow({ kind: 'idle' });
              return;
            }
            const id = `passkey_${Math.random().toString(36).slice(2, 12)}`;
            await completeLogin('passkey', id);
          })();
          break;
        case 'wallet':
          setLoginFlow({ kind: 'walletconnect', session: createMockWcSession() });
          break;
      }
    },
    [completeLogin],
  );

  const login = useCallback(
    (options?: LoginOptions) => {
      const methods = options?.loginMethod ? [options.loginMethod] : config.loginMethods;
      setLoginFlow({ kind: 'picker', methods, mode: 'login' });
    },
    [config.loginMethods],
  );

  const connectWallet = useCallback(() => {
    setLoginFlow({ kind: 'walletconnect', session: createMockWcSession() });
  }, []);

  const switchWallet = useCallback(() => {
    setLoginFlow({ kind: 'picker', methods: config.loginMethods, mode: 'switch' });
  }, [config.loginMethods]);

  const logout = useCallback(() => {
    clearAll();
    setUser(null);
    setWallets([]);
    setActiveWalletAddress(null);
  }, []);

  const signMessage = useCallback(
    (message: string): Promise<SignMessageResult> => {
      const active = wallets.find((w: ConnectedWallet) => w.address === activeWalletAddress);
      if (!active) return Promise.reject(new Error('No active wallet'));
      return new Promise<SignMessageResult>((resolve, reject) => {
        if (active.walletClientType === 'privy') {
          setSignFlow({ kind: 'embedded', message, resolve, reject });
        } else {
          setSignFlow({ kind: 'external', message, resolve, reject });
        }
      });
    },
    [wallets, activeWalletAddress],
  );

  useEffect(() => {
    if (signFlow.kind !== 'embedded') return;
    let cancelled = false;
    setBiometric({ title: 'Confirm to continue', subtitle: 'Sign with Face ID' });
    (async () => {
      const ok = await requestBiometricSignature();
      if (cancelled) return;
      setBiometric(null);
      if (ok) signFlow.resolve({ signature: generateFakeSignature() });
      else signFlow.reject(new Error('User cancelled'));
      setSignFlow({ kind: 'idle' });
    })();
    return () => {
      cancelled = true;
    };
  }, [signFlow]);

  const cancelLoginFlow = () => setLoginFlow({ kind: 'idle' });

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      authenticated: !!user,
      user,
      wallets,
      activeWalletAddress,
      config,
      login,
      logout,
      connectWallet,
      signMessage,
      switchWallet,
    }),
    [
      ready,
      user,
      wallets,
      activeWalletAddress,
      config,
      login,
      logout,
      connectWallet,
      signMessage,
      switchWallet,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}

      {loginFlow.kind === 'picker' && (
        <LoginPicker
          methods={loginFlow.methods}
          onPick={handleMethodPick}
          onDismiss={cancelLoginFlow}
        />
      )}
      {loginFlow.kind === 'apple' && (
        <AppleFlow
          onComplete={(subject) => void completeLogin('apple', subject)}
          onCancel={cancelLoginFlow}
        />
      )}
      {loginFlow.kind === 'email' && (
        <EmailOtpFlow
          onSubmit={(email) => void completeLogin('email', email)}
          onCancel={cancelLoginFlow}
        />
      )}
      {loginFlow.kind === 'walletconnect' && (
        <WalletConnectModal
          session={loginFlow.session}
          onSimulateScan={() =>
            void completeLogin('wallet', loginFlow.session.expectedAddress, loginFlow.session.expectedAddress)
          }
          onCancel={cancelLoginFlow}
        />
      )}

      {signFlow.kind === 'external' && (
        <ExternalSignOverlay
          onSimulate={() => {
            signFlow.resolve({ signature: generateFakeSignature() });
            setSignFlow({ kind: 'idle' });
          }}
          onCancel={() => {
            signFlow.reject(new Error('User cancelled'));
            setSignFlow({ kind: 'idle' });
          }}
        />
      )}

      {biometric && <BiometricOverlay title={biometric.title} subtitle={biometric.subtitle} />}
    </AuthContext.Provider>
  );
}
