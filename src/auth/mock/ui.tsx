import { useState, useEffect, type ReactNode } from 'react';
import { Apple, Mail, Fingerprint, Wallet as WalletIcon, X, Loader2, Copy, Check } from 'lucide-react';
import type { LoginMethod } from '../types';
import { buildQrMatrix, type MockWcSession } from './walletconnect';

interface OverlayProps {
  onDismiss?: () => void;
  children: ReactNode;
}

function Overlay({ onDismiss, children }: OverlayProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-end p-3">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
        <div className="px-6 pb-8">{children}</div>
      </div>
    </div>
  );
}

interface LoginPickerProps {
  methods: LoginMethod[];
  onPick: (method: LoginMethod) => void;
  onDismiss: () => void;
}

const METHOD_META: Record<LoginMethod, { label: string; icon: typeof Apple; cls: string }> = {
  apple: { label: 'Continue with Apple', icon: Apple, cls: 'bg-black text-white hover:bg-gray-900' },
  email: { label: 'Continue with email', icon: Mail, cls: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50' },
  passkey: { label: 'Continue with passkey', icon: Fingerprint, cls: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50' },
  wallet: { label: 'Connect a wallet', icon: WalletIcon, cls: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50' },
};

export function LoginPicker({ methods, onPick, onDismiss }: LoginPickerProps) {
  return (
    <Overlay onDismiss={onDismiss}>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Sign in to AdPal</h2>
      <p className="text-sm text-gray-500 mb-6">Earn tokens for displaying ads on your E-ink case.</p>
      <div className="flex flex-col gap-3">
        {methods.map((m) => {
          const meta = METHOD_META[m];
          const Icon = meta.icon;
          return (
            <button
              key={m}
              onClick={() => onPick(m)}
              className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-medium transition-all ${meta.cls}`}
            >
              <Icon className="w-5 h-5" />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-6 text-center">
        By continuing you agree to AdPal's Terms and Privacy Policy.
      </p>
    </Overlay>
  );
}

interface EmailOtpProps {
  onSubmit: (email: string, code: string) => void;
  onCancel: () => void;
}

export function EmailOtpFlow({ onSubmit, onCancel }: EmailOtpProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  return (
    <Overlay onDismiss={onCancel}>
      {step === 'email' ? (
        <>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Enter your email</h2>
          <p className="text-sm text-gray-500 mb-6">We'll send a 6-digit code to confirm.</p>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e: { target: { value: string } }) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-gray-900"
          />
          <button
            onClick={() => email.includes('@') && setStep('code')}
            disabled={!email.includes('@')}
            className="mt-4 w-full py-3.5 rounded-2xl bg-black text-white font-medium disabled:opacity-40"
          >
            Send code
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Enter the code</h2>
          <p className="text-sm text-gray-500 mb-6">Sent to {email}. Any 6 digits work in the demo.</p>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e: { target: { value: string } }) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:border-gray-900 text-center tracking-[0.5em] text-lg"
          />
          <button
            onClick={() => code.length === 6 && onSubmit(email, code)}
            disabled={code.length !== 6}
            className="mt-4 w-full py-3.5 rounded-2xl bg-black text-white font-medium disabled:opacity-40"
          >
            Verify
          </button>
          <button
            onClick={() => setStep('email')}
            className="mt-2 w-full py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Use a different email
          </button>
        </>
      )}
    </Overlay>
  );
}

interface AppleFlowProps {
  onComplete: (subject: string) => void;
  onCancel: () => void;
}

export function AppleFlow({ onComplete, onCancel }: AppleFlowProps) {
  useEffect(() => {
    const t = setTimeout(() => {
      onComplete(`apple_${Math.random().toString(36).slice(2, 10)}`);
    }, 900);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <Overlay onDismiss={onCancel}>
      <div className="flex flex-col items-center py-10">
        <Apple className="w-12 h-12 text-black mb-4" />
        <p className="text-base font-medium text-gray-900">Signing in with Apple…</p>
        <p className="text-sm text-gray-500 mt-1">Using your Apple ID</p>
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin mt-6" />
      </div>
    </Overlay>
  );
}

interface WcModalProps {
  session: MockWcSession;
  onSimulateScan: () => void;
  onCancel: () => void;
}

export function WalletConnectModal({ session, onSimulateScan, onCancel }: WcModalProps) {
  const matrix = buildQrMatrix(session.uri);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(session.uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <Overlay onDismiss={onCancel}>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Connect a wallet</h2>
      <p className="text-sm text-gray-500 mb-6">Scan with your wallet app or paste the URI.</p>
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mx-auto w-fit">
        <div
          className="grid bg-white"
          style={{
            gridTemplateColumns: `repeat(${matrix.length}, 8px)`,
            gridTemplateRows: `repeat(${matrix.length}, 8px)`,
          }}
        >
          {matrix.flatMap((row, r) =>
            row.map((on, c) => (
              <div key={`${r}-${c}`} className={on ? 'bg-black' : 'bg-white'} />
            )),
          )}
        </div>
      </div>
      <button
        onClick={copy}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm text-gray-700"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied' : 'Copy URI'}
      </button>
      <button
        onClick={onSimulateScan}
        className="mt-3 w-full py-3.5 rounded-2xl bg-black text-white font-medium"
      >
        Simulate scan & approve
      </button>
    </Overlay>
  );
}

interface BiometricOverlayProps {
  title: string;
  subtitle?: string;
}

export function BiometricOverlay({ title, subtitle }: BiometricOverlayProps) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="bg-white rounded-3xl px-8 py-10 mx-6 max-w-xs flex flex-col items-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mb-4">
          <Fingerprint className="w-8 h-8 text-white" />
        </div>
        <p className="text-base font-medium text-gray-900 text-center">{title}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1 text-center">{subtitle}</p>}
      </div>
    </div>
  );
}

interface ExternalSignOverlayProps {
  onSimulate: () => void;
  onCancel: () => void;
}

export function ExternalSignOverlay({ onSimulate, onCancel }: ExternalSignOverlayProps) {
  return (
    <Overlay onDismiss={onCancel}>
      <div className="flex flex-col items-center py-6">
        <WalletIcon className="w-10 h-10 text-gray-900 mb-3" />
        <p className="text-base font-medium text-gray-900">Open in wallet app…</p>
        <p className="text-sm text-gray-500 mt-1 text-center">
          Approve the request in the wallet you connected.
        </p>
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin mt-5" />
        <button
          onClick={onSimulate}
          className="mt-6 w-full py-3.5 rounded-2xl bg-black text-white font-medium"
        >
          Simulate approval
        </button>
      </div>
    </Overlay>
  );
}
