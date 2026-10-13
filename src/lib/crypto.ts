/**
 * End-to-end encryption utilities using the Web Crypto API.
 *
 * Flow:
 * 1. Each user generates an ECDH key pair on first login.
 * 2. The public key is stored in the `profiles` table; the private key stays in localStorage.
 * 3. To send a DM, the sender imports the recipient's public key, derives a shared AES key via ECDH,
 *    encrypts the message with AES-GCM, and stores the ciphertext + IV.
 * 4. The recipient derives the same shared key using their private key + sender's public key, and decrypts.
 */

const PRIVATE_KEY_STORAGE_PREFIX = 'e2e_private_key_';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
}

export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );

  const pubKeyBuf = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privKeyBuf = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: bufferToBase64(pubKeyBuf),
    privateKey: bufferToBase64(privKeyBuf),
  };
}

export function storePrivateKey(userId: string, privateKey: string): void {
  localStorage.setItem(`${PRIVATE_KEY_STORAGE_PREFIX}${userId}`, privateKey);
}

export function getStoredPrivateKey(userId: string): string | null {
  return localStorage.getItem(`${PRIVATE_KEY_STORAGE_PREFIX}${userId}`);
}

async function importPublicKey(base64: string): Promise<CryptoKey> {
  const buf = base64ToBuffer(base64);
  return crypto.subtle.importKey('spki', buf, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}

async function importPrivateKey(base64: string): Promise<CryptoKey> {
  const buf = base64ToBuffer(base64);
  return crypto.subtle.importKey('pkcs8', buf, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
}

async function deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(
  plaintext: string,
  recipientPublicKeyBase64: string,
  senderPrivateKeyBase64: string
): Promise<EncryptedPayload> {
  const recipientPubKey = await importPublicKey(recipientPublicKeyBase64);
  const senderPrivKey = await importPrivateKey(senderPrivateKeyBase64);
  const sharedKey = await deriveSharedKey(senderPrivKey, recipientPubKey);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertextBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, encoded);

  return {
    ciphertext: bufferToBase64(ciphertextBuf),
    iv: bufferToBase64(iv),
  };
}

export async function decryptMessage(
  ciphertextBase64: string,
  ivBase64: string,
  senderPublicKeyBase64: string,
  recipientPrivateKeyBase64: string
): Promise<string> {
  const senderPubKey = await importPublicKey(senderPublicKeyBase64);
  const recipientPrivKey = await importPrivateKey(recipientPrivateKeyBase64);
  const sharedKey = await deriveSharedKey(recipientPrivKey, senderPubKey);

  const ciphertext = base64ToBuffer(ciphertextBase64);
  const iv = base64ToBuffer(ivBase64);
  const decryptedBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedKey, ciphertext);

  return new TextDecoder().decode(decryptedBuf);
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
