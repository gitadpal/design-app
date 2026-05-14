const RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const RP_NAME = 'AdPal';

function randomChallenge(): BufferSource {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return buf as unknown as BufferSource;
}

function userIdBuffer(userId: string): BufferSource {
  return new TextEncoder().encode(userId) as unknown as BufferSource;
}

export function isBiometricSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'PublicKeyCredential' in window &&
    typeof navigator !== 'undefined' &&
    !!navigator.credentials
  );
}

export async function enrollPasskey(userId: string, displayName: string): Promise<boolean> {
  if (!isBiometricSupported()) return true;
  try {
    await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { id: RP_ID, name: RP_NAME },
        user: {
          id: userIdBuffer(userId),
          name: displayName,
          displayName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function requestBiometricSignature(): Promise<boolean> {
  if (!isBiometricSupported()) return true;
  try {
    await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        rpId: RP_ID,
        userVerification: 'required',
        timeout: 60000,
        allowCredentials: [],
      },
      mediation: 'optional',
    } as CredentialRequestOptions);
    return true;
  } catch (err) {
    const e = err as { name?: string };
    if (e?.name === 'NotAllowedError') return false;
    return true;
  }
}

export function generateFakeSignature(): string {
  const bytes = new Uint8Array(65);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

