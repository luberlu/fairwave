import CryptoJS from 'crypto-js';
import Gun from 'gun';
import { encryptionKey } from '../user/UserStore';
import { getAuthenticatedAddress } from './Auth';

const gun = Gun(['http://localhost:8765/gun']);

export async function initializeEncryptionKey(passphrase: string): Promise<void> {
	const derivedKey = CryptoJS.SHA256(passphrase).toString(CryptoJS.enc.Hex);
	encryptionKey.set(derivedKey);

	const storedAddress = getAuthenticatedAddress();
	if (storedAddress) {
		gun.get('userProfiles').get(storedAddress).put({ encryptionKey: derivedKey });
		localStorage.setItem('encryptionKey', derivedKey);
	}
}

export function getEncryptionKey(): string | null {
	return localStorage.getItem('encryptionKey') || null;
}
