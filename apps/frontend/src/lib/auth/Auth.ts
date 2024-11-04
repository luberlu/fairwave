// authStore.ts
import { ethers } from 'ethers';
import { did, status, isAuthenticated, encryptionKey } from '../user/UserStore';
import { getEncryptionKey } from './EncryptionKey';
import { goto } from '$app/navigation';

const BACKEND_URL = 'http://localhost:3000/auth';

// Authentifie l'utilisateur via MetaMask
export async function authenticate(): Promise<void> {
	status.set("Authentification en cours...");

	if (!isMetaMaskAvailable()) {
		status.set("Veuillez installer MetaMask pour continuer.");
		return;
	}

	try {
		const { userAddress, signature } = await getUserAddressAndSignature();
		const userDid = generateDid(userAddress);
		const userProfile = await getUserProfileFromBackend(userDid);

		if (!userProfile) {
			status.set("Aucun profil utilisateur trouvé. Redirection vers la création de profil...");
			goto('/user/create');
			return;
		} else {
			status.set("Utilisateur authentifié avec succès !");
			return;
		}

		did.set(userDid);
		isAuthenticated.set(true);

		// Gère la clé de chiffrement de l'utilisateur
		await handleEncryptionKey(userProfile);
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
async function getUserProfileFromBackend(userDid: string) {
	try {
		const response = await fetch(`${BACKEND_URL}/get-profile/${encodeURIComponent(userDid)}`);
		const data = await response.json();
		return data.success ? data.profile : null;
	} catch (error) {
		console.error("Erreur lors de la récupération du profil utilisateur :", error);
		status.set("Erreur lors de la récupération du profil utilisateur.");
		return null;
	}
}

// Stocke un nouveau profil utilisateur dans le backend en utilisant le DID
async function storeUserProfileInBackend(userDid: string, signature: string) {
	try {
		const response = await fetch(`${BACKEND_URL}/store-profile`, {
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
