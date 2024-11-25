import CryptoJS from 'crypto-js';
import { authStore, setAuthState } from './AuthStore';
import { get } from 'svelte/store';

/**
 * Initialise la clé de chiffrement basée sur une passphrase.
 * @param passphrase La passphrase utilisée pour générer la clé.
 * @returns Une promesse résolue une fois la clé générée.
 */
export async function initializeEncryptionKey(passphrase: string): Promise<void> {
	// Génère une clé dérivée en utilisant SHA-256
	const derivedKey = CryptoJS.SHA256(passphrase).toString(CryptoJS.enc.Hex);
	setAuthState({ encryptionKey: derivedKey });
}

/**
 * Récupère la clé de chiffrement depuis le store.
 * @returns La clé de chiffrement ou null si elle n'est pas disponible.
 */
export function getEncryptionKey(): string | null {
	// Récupère l'état actuel du store d'authentification
	const { encryptionKey } = get(authStore);
	return encryptionKey;
}
