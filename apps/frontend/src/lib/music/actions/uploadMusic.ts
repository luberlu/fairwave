import { userProfile } from '../../user/UserStore.svelte';
import { authStore } from '../../auth/AuthStore';
import { setStatus } from '../../status/StatusStore';
import { get } from 'svelte/store';

/**
 * Charge un fichier audio sur le serveur.
 * @param title - Titre de la musique.
 * @param file - Fichier audio à uploader.
 * @returns Un objet indiquant le succès ou l'échec de l'opération.
 */
export async function uploadMusic(title: string, file: File | null): Promise<{ success: boolean; cid?: string; message?: string }> {
	if (!file || !title) {
		setStatus("Erreur : Titre ou fichier manquant.");
		return { success: false, message: "Champs manquants" };
	}

	const { did } = get(userProfile);
	const { encryptionKey } = get(authStore);

	if (!did) {
		setStatus("Erreur : Utilisateur non authentifié.");
		return { success: false, message: "Utilisateur non authentifié" };
	}

	if (!encryptionKey) {
		setStatus("Erreur : Clé de chiffrement introuvable.");
		return { success: false, message: "Clé de chiffrement non définie" };
	}

	const formData = new FormData();
	formData.append('title', title);
	formData.append('file', file);
	formData.append('secretKey', encryptionKey);
	formData.append('userDid', did);

	try {
		const response = await fetch('/api/music/upload', {
			method: 'POST',
			body: formData,
		});

		const result = await response.json();

		if (response.ok && result.success) {
			setStatus("Musique uploadée avec succès !");
			return { success: true, cid: result.cid };
		} else {
			const message = result.message || "Erreur inconnue lors de l'upload.";
			setStatus(`Erreur : ${message}`);
			return { success: false, message };
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Erreur inconnue.";
		console.error("Erreur lors de l'upload de musique :", error);
		setStatus(`Erreur : ${errorMessage}`);
		return { success: false, message: errorMessage };
	}
}
