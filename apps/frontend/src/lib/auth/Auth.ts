// authStore.ts
import { ethers } from 'ethers';
import { did, status, isAuthenticated, isArtist, setUserProfile } from '../user/UserStore';
import { goto } from '$app/navigation';
import { fetchUser, saveUser } from '../user/UserActions';

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
		let user = await fetchUser(userDid); // Utilise la fonction migrée pour récupérer le profil

		// Enregistre un profil de base si l'utilisateur n'existe pas
		if (!user) {
			await saveUser(userDid, signature); // Utilise la fonction migrée pour sauvegarder le profil
			status.set("Profil utilisateur de base créé avec succès !");
			user = { did: userDid }; // Profil basique sans champ isArtist
		} else {
			status.set("Utilisateur authentifié avec succès !");
		}

		// Met à jour le store avec le DID et les informations de profil
		did.set(userDid);
		isAuthenticated.set(true);
		isArtist.set(user.role || false); // Définit le rôle en fonction du profil, par défaut à false

		// Si le profil est incomplet, redirige vers la page de création de profil
		if (user.role === undefined) {
			goto('/user/create');
		} else {
			setUserProfile(user);
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

// Génère un DID pour l'utilisateur basé sur l'adresse Ethereum
function generateDid(userAddress: string): string {
	return `did:ether:${userAddress}`;
}
