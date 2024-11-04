import { did, username, role, artistName, status, isAuthenticated, encryptionKey } from './UserStore';
import { authenticate as authStoreAuthenticate } from '../auth/Auth';
import { initializeEncryptionKey } from '../auth/EncryptionKey';

export async function authenticate() {
	await authStoreAuthenticate();
}

export function logout() {
	// Réinitialiser chaque store à sa valeur initiale
	isAuthenticated.set(false);
	encryptionKey.set(null);
	did.set('');
	username.set('');
	role.set('');
	artistName.set('');

	// Mettre à jour le statut de déconnexion
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
