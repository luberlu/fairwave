import { address, status, isAuthenticated, encryptionKey } from './UserStore';
import { authenticate as authStoreAuthenticate } from './Auth';
import { initializeEncryptionKey } from './Encryption';

export async function authenticate() {
	await authStoreAuthenticate();
}

export function logout() {
	address.set('');
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
