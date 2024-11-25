import { ethers } from 'ethers';
import { setUserProfile } from '../user/UserStore.svelte';
import { setAuthState } from './AuthStore';
import { setStatus } from '../status/StatusStore';
import { goto } from '$app/navigation';
import { fetchUser, saveUser } from '../user/UserActions';

/**
 * Authentifie l'utilisateur via MetaMask et enregistre un profil de base si nécessaire.
 */
export async function authenticate(): Promise<void> {
	setStatus('Authentification en cours...');

	if (!isMetaMaskAvailable()) {
		setStatus('Veuillez installer MetaMask pour continuer.');
		return;
	}

	try {
		const { userAddress, signature } = await getUserAddressAndSignature();
		const userDid = generateDid(userAddress); // Génère le DID à partir de l'adresse
		let user = await fetchUser(userDid); // Récupère le profil utilisateur

		// Enregistre un profil de base si l'utilisateur n'existe pas
		if (!user) {
			await saveUser(userDid, signature); // Crée un nouveau profil
			setStatus('Profil utilisateur de base créé avec succès !');
			user = { did: userDid }; // Profil basique sans champ `isArtist`
		} else {
			setStatus('Utilisateur authentifié avec succès !');
		}

		// Met à jour les stores avec les informations utilisateur
		setAuthState({ isAuthenticated: true });
		setUserProfile({ ...user, did: userDid });

		// Redirige en fonction de l'état du profil utilisateur
		if (!user.role) {
			goto('/user/create');
		} else {
			goto('/user/profile');
		}
	} catch (error) {
		console.error('Erreur lors de l\'authentification :', error);
		setStatus('Erreur lors de l\'authentification.');
	}
}

/**
 * Vérifie si MetaMask est disponible.
 */
function isMetaMaskAvailable(): boolean {
	return typeof window !== 'undefined' && (window as any).ethereum;
}

/**
 * Récupère l'adresse et la signature de l'utilisateur via MetaMask.
 */
async function getUserAddressAndSignature(): Promise<{ userAddress: string; signature: string }> {
	const provider = new ethers.BrowserProvider((window as any).ethereum);
	const signer = await provider.getSigner();
	const userAddress = await signer.getAddress();

	const message = 'Veuillez signer ce message pour authentifier votre session.';
	const signature = await signer.signMessage(message);

	return { userAddress, signature };
}

/**
 * Génère un DID pour l'utilisateur basé sur l'adresse Ethereum.
 */
function generateDid(userAddress: string): string {
	return `did:ether:${userAddress}`;
}
