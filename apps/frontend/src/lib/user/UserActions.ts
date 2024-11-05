// UserActions.ts
import { did, username, role, artistName, status, isAuthenticated, encryptionKey } from './UserStore';
import { authenticate as authStoreAuthenticate } from '../auth/Auth';
import { get } from 'svelte/store';
import { initializeEncryptionKey } from '$lib/auth/EncryptionKey';

// Authentifie l'utilisateur via MetaMask en utilisant la fonction existante d'authStore
export async function authenticateUser() {
	await authStoreAuthenticate();
}

// Déconnecte l'utilisateur et réinitialise le store
export function logout() {
	isAuthenticated.set(false);
	encryptionKey.set(null);
	did.set('');
	username.set('');
	role.set('');
	artistName.set('');

	status.set('Déconnecté avec succès.');
	displayStatusMessage();
}

// Met à jour le profil utilisateur dans le backend
export async function updateUser(updates: any) {
	const userDid = get(did);

    if (!userDid) {
        status.set("Erreur : DID utilisateur non disponible.");
        return;
    }

    try {
        const response = await fetch(`/api/auth/update-profile/${encodeURIComponent(userDid)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        const data = await response.json();

        if (data.success) {
            status.set("Profil utilisateur mis à jour avec succès !");
        } else {
            status.set(data.error || "Erreur lors de la mise à jour du profil utilisateur.");
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du profil utilisateur :", error);
        status.set("Erreur lors de la mise à jour du profil utilisateur.");
    }
}

// Récupère le profil utilisateur depuis le backend en utilisant le DID
export async function fetchUser(userDid: string) {
	try {
		const response = await fetch(`/api/auth/get-profile/${encodeURIComponent(userDid)}`);
		const data = await response.json();
		return data.success ? data.profile : null;
	} catch (error) {
		console.error("Erreur lors de la récupération du profil utilisateur :", error);
		status.set("Erreur lors de la récupération du profil utilisateur.");
		return null;
	}
}

// Stocke un nouveau profil utilisateur dans le backend en utilisant le DID et la signature
export async function saveUser(userDid: string, signature: string) {
	try {
		const response = await fetch(`/api/auth/store-profile`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ did: userDid, signature }),
		});
		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || "Erreur lors du stockage du profil utilisateur");
		}
	} catch (error) {
		console.error("Erreur lors du stockage du profil utilisateur :", error);
		status.set("Erreur lors du stockage du profil utilisateur.");
	}
}

// Configure la clé de chiffrement pour l'utilisateur
export async function setEncryptionKey(passphrase: string) {
	if (passphrase) {
		await initializeEncryptionKey(passphrase);
		status.set("Clé de chiffrement générée avec succès !");
		displayStatusMessage();
	} else {
		status.set("Veuillez entrer une passphrase valide.");
		displayStatusMessage();
	}
}

// Affiche un message de statut temporaire
export function displayStatusMessage() {
	status.update(value => {
		setTimeout(() => {
			status.set('');
		}, 3000);
		return value;
	});
}
