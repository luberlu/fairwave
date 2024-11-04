import {
	address,
	status,
	isAuthenticated,
	authenticate as authStoreAuthenticate,
	encryptionKey,
	initializeEncryptionKey,
} from './authStore';

export class User {
	static async authenticate() {
		await authStoreAuthenticate();
	}

	static logout() {
		address.set('');
		isAuthenticated.set(false);
		encryptionKey.set(null);
		localStorage.removeItem('userAddress');
		localStorage.removeItem('encryptionKey');
		status.set('Déconnecté avec succès.');
		this.showStatusMessage();
	}

	static async setEncryptionKey(passphrase: string) {
		if (passphrase) {
			await initializeEncryptionKey(passphrase);
			status.set("Clé de chiffrement générée avec succès !");
			this.showStatusMessage();
		} else {
			status.set("Veuillez entrer une passphrase valide.");
			this.showStatusMessage();
		}
	}

	static showStatusMessage() {
		status.update(value => {
			setTimeout(() => {
				status.set('');
			}, 3000);
			return value;
		});
	}
}
