import { userProfile, setUserProfile, resetUserProfile, type UserProfile } from './UserStore.svelte';
import { setAuthState, resetAuthState } from '../auth/AuthStore';
import { setStatus } from '../status/StatusStore';
import { authenticate as authStoreAuthenticate } from '../auth/Auth';
import { initializeEncryptionKey } from '$lib/auth/EncryptionKey';

/**
 * Authentifie l'utilisateur via MetaMask en utilisant la fonction existante d'authStore.
 */
export async function authenticateUser(): Promise<void> {
	await authStoreAuthenticate();
}

/**
 * Déconnecte l'utilisateur et réinitialise les stores.
 */
export function logout(): void {
	resetUserProfile();
	resetAuthState();
	setStatus('Déconnecté avec succès.');
}

/**
 * Met à jour le profil utilisateur dans le backend.
 * @param updates Les données à mettre à jour.
 * @returns Une promesse qui se résout une fois l'opération terminée.
 */
export async function updateUser(updates: Partial<UserProfile>): Promise<void> {
	const { did } = userProfile;

	if (!did) {
		setStatus('Erreur : DID utilisateur non disponible.');
		return;
	}

	try {
		const response = await fetch(`/api/user/update/${encodeURIComponent(did)}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updates),
		});
		const data = await response.json();

		if (data.success) {
			setUserProfile(updates);
			setStatus('Profil utilisateur mis à jour avec succès !');
		} else {
			setStatus(data.error || 'Erreur lors de la mise à jour du profil utilisateur.');
		}
	} catch (error) {
		console.error('Erreur lors de la mise à jour du profil utilisateur :', error);
		setStatus('Erreur lors de la mise à jour du profil utilisateur.');
	}
}

/**
 * Récupère le profil utilisateur depuis le backend en utilisant le DID.
 * @param userDid Le DID de l'utilisateur.
 * @returns Une promesse contenant le profil utilisateur ou null en cas d'erreur.
 */
export async function fetchUser(userDid: string): Promise<any | null> {
	try {
		const response = await fetch(`/api/user/get/${encodeURIComponent(userDid)}`);
		const data = await response.json();

		if (data.success) {
			setUserProfile(data.profile);
			return data.profile;
		}

		setStatus(data.error || 'Erreur lors de la récupération du profil utilisateur.');
		return null;
	} catch (error) {
		console.error('Erreur lors de la récupération du profil utilisateur :', error);
		setStatus('Erreur lors de la récupération du profil utilisateur.');
		return null;
	}
}

/**
 * Stocke un nouveau profil utilisateur dans le backend.
 * @param userDid Le DID de l'utilisateur.
 * @param signature La signature pour vérifier l'identité.
 * @returns Une promesse qui se résout une fois l'opération terminée.
 */
export async function saveUser(userDid: string, signature: string): Promise<void> {
	try {
		const response = await fetch(`/api/user/store`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ did: userDid, signature }),
		});
		const data = await response.json();

		if (!data.success) {
			throw new Error(data.error || 'Erreur lors du stockage du profil utilisateur');
		}
	} catch (error) {
		console.error('Erreur lors du stockage du profil utilisateur :', error);
		setStatus('Erreur lors du stockage du profil utilisateur.');
	}
}

/**
 * Configure la clé de chiffrement pour l'utilisateur.
 * @param passphrase La passphrase utilisée pour générer la clé.
 * @returns Une promesse qui se résout une fois la clé générée.
 */
export async function setEncryptionKey(passphrase: string): Promise<void> {
	if (passphrase) {
		await initializeEncryptionKey(passphrase);
		setAuthState({ encryptionKey: passphrase });
		setStatus('Clé de chiffrement générée avec succès !');
	} else {
		setStatus('Veuillez entrer une passphrase valide.');
	}
}
