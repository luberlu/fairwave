import CryptoJS from 'crypto-js';
import { encryptionKey } from '../user/UserStore';

export async function initializeEncryptionKey(passphrase: string): Promise<void> {
	const derivedKey = CryptoJS.SHA256(passphrase).toString(CryptoJS.enc.Hex);
	encryptionKey.set(derivedKey);
}

export function getEncryptionKey(): string | null {
	return localStorage.getItem('encryptionKey') || null;
}
