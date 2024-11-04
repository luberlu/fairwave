import { status, isAuthenticated, encryptionKey } from './UserStore';
import { authenticate as authStoreAuthenticate } from '../auth/Auth';
import { initializeEncryptionKey } from '../auth/EncryptionKey';

const BACKEND_URL = 'http://localhost:3000/auth';

export async function authenticate() {
	await authStoreAuthenticate();
}

export function logout() {
	isAuthenticated.set(false);
	encryptionKey.set(null);
	localStorage.removeItem('userAddress');
	localStorage.removeItem('encryptionKey');
	status.set('Déconnecté avec succès.');
	showStatusMessage();
}

export async function setEncryptionKey(passphrase: string) {
	if (passphrase) {
		await initializeEncryptionKey(passphrase);
		status.set("Clé de chiffrement générée avec succès !");
		showStatusMessage();
	} else {
		status.set("Veuillez entrer une passphrase valide.");
		showStatusMessage();
	}
}

export function showStatusMessage() {
	status.update(value => {
		setTimeout(() => {
			status.set('');
		}, 3000);
		return value;
	});
}

export async function checkUserExists(): Promise<boolean> {
	const did = localStorage.getItem('userDID');
	if (!did) return false;

	try {
		const response = await fetch(`${BACKEND_URL}/get-profile/${encodeURIComponent(did)}`);
		const data = await response.json();
		return data.success && data.profile !== null;
	} catch (error) {
		console.error("Erreur lors de la vérification de l'existence du profil utilisateur :", error);
		return false;
	}
}
