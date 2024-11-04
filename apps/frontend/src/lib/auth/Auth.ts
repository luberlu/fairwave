// authStore.ts
import { ethers } from 'ethers';
import { did, status, isAuthenticated, encryptionKey, isArtist, setUserProfile } from '../user/UserStore';
import { getEncryptionKey } from './EncryptionKey';
import { goto } from '$app/navigation';
import { get } from 'svelte/store';

// Authentifie l'utilisateur via MetaMask et enregistre un profil de base si nécessaire
export async function authenticate(): Promise<void> {
	status.set("Authentification en cours...");

	if (!isMetaMaskAvailable()) {
		status.set("Veuillez installer MetaMask pour continuer.");
		return;
	}

	try {
		const { userAddress, signature } = await getUserAddressAndSignature();
		const userDid = generateDid(userAddress); // Génère le DID à partir de l'adresse
		let userProfile = await getUserProfileFromBackend(userDid);

		// Enregistre un profil de base si l'utilisateur n'existe pas
		if (!userProfile) {
			await storeUserProfileInBackend(userDid, signature);
			status.set("Profil utilisateur de base créé avec succès !");
			userProfile = { did: userDid }; // Profil basique sans champ isArtist
		} else {
			status.set("Utilisateur authentifié avec succès !");
		}

		console.log('userProfile => ', userProfile);

		// Met à jour le store avec le DID et les informations de profil
		did.set(userDid);
		isAuthenticated.set(true);
		isArtist.set(userProfile.role || false); // Définit le rôle en fonction du profil, par défaut à false

		console.log('userProfile.isArtist => ', userProfile.isArtist);

		// Si le profil est incomplet, redirige vers la page de création de profil
		if (userProfile.role === undefined) {
			goto('/user/create');
		} else {
			setUserProfile(userProfile);
			goto('/user/profile');
		}
	} catch (error) {
		console.error("Erreur lors de l'authentification :", error);
		status.set("Erreur lors de l'authentification.");
	}
}

// Vérifie si MetaMask est disponible
function isMetaMaskAvailable(): boolean {
	return typeof window !== 'undefined' && (window as any).ethereum;
}

// Récupère l'adresse et la signature de l'utilisateur
async function getUserAddressAndSignature() {
	const provider = new ethers.BrowserProvider((window as any).ethereum);
	const signer = await provider.getSigner();
	const userAddress = await signer.getAddress();

	const message = "Veuillez signer ce message pour authentifier votre session.";
	const signature = await signer.signMessage(message);

	return { userAddress, signature };
}

// Récupère le profil utilisateur depuis le backend en utilisant le DID
export async function getUserProfileFromBackend(userDid: string) {
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
async function storeUserProfileInBackend(userDid: string, signature: string) {
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

export async function updateUserProfile(updates: any) {
	const userDid = get(did); // Récupère le DID depuis le store

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

// Gère la clé de chiffrement de l'utilisateur
async function handleEncryptionKey(userProfile: any) {
	const storedEncryptionKey = getEncryptionKey();

	if (storedEncryptionKey) {
		encryptionKey.set(storedEncryptionKey);
	} else if (userProfile && userProfile.encryptionKey) {
		encryptionKey.set(userProfile.encryptionKey);
		localStorage.setItem('encryptionKey', userProfile.encryptionKey);
	} else {
		status.set("Veuillez entrer une passphrase pour configurer le chiffrement.");
	}
}

// Génère un DID pour l'utilisateur basé sur l'adresse Ethereum
function generateDid(userAddress: string): string {
	return `did:ether:${userAddress}`;
}
