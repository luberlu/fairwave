import { did, encryptionKey } from '../../user/UserStore';
import { get } from 'svelte/store';

export async function uploadMusic(title: string, file: File | null) {
	if (!file || !title) {
		return { success: false, message: "Champs manquants" };
	}
	
	const userDid = get(did);
	
	if (!userDid) {
		return { success: false, message: "Utilisateur non authentifié" };
	}

	const key = get(encryptionKey);

	if (!key) {
		return { success: false, message: "Erreur : clé de chiffrement non définie" };
	}

	const formData = new FormData();
	formData.append('title', title);
	formData.append('file', file);
	formData.append('secretKey', key);
	formData.append('userDid', userDid);

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
