// uploadMusic.ts
import { getAuthenticatedAddress } from '../../auth/Auth';
import { getEncryptionKey } from '../../auth/EncryptionKey';

export async function uploadMusic(title: string, file: File | null) {
	if (!file || !title) {
		return { success: false, message: "Champs manquants" };
	}

	const storedAddress = getAuthenticatedAddress();
	if (!storedAddress) {
		return { success: false, message: "Utilisateur non authentifié" };
	}

	const secretKey = getEncryptionKey();
	if (!secretKey) {
		return { success: false, message: "Erreur : clé de chiffrement non définie" };
	}

	const formData = new FormData();
	formData.append('title', title);
	formData.append('file', file);
	formData.append('secretKey', secretKey);
	formData.append('userAddress', storedAddress);

	try {
		const response = await fetch('/api/music/upload', {
			method: 'POST',
			body: formData,
		});

		const result = await response.json();
		return result.success ? { success: true, cid: result.cid } : { success: false };
	} catch (error) {
		console.error("Erreur lors de l'upload de musique :", error);
		return { success: false };
	}
}
