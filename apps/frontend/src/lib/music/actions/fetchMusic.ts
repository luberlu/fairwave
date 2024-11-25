import { userProfile } from '../../user/UserStore.svelte';
import { authStore } from '../../auth/AuthStore';
import { setStatus } from '../../status/StatusStore';
import { Music } from '../Music';
import { get } from 'svelte/store';

/**
 * Récupère et initialise un fichier audio en streaming.
 * @param cid - L'identifiant de contenu du fichier audio.
 * @param audioElement - L'élément HTMLAudioElement pour le streaming.
 * @returns Une instance de Music ou null en cas d'erreur.
 */
export async function fetchMusic(
	cid: string,
	audioElement: HTMLAudioElement | null
): Promise<Music | null> {
	if (!audioElement) {
		setStatus('Erreur : Élément audio introuvable.');
		return null;
	}

	const { encryptionKey } = get(authStore);
	const { did } = userProfile.value;

	if (!encryptionKey) {
		setStatus('Erreur : Clé de déchiffrement introuvable.');
		return null;
	}

	if (!did) {
		setStatus('Erreur : Utilisateur non authentifié.');
		return null;
	}

	const music = new Music(audioElement);

	try {
		// Requête pour récupérer le fichier audio en streaming
		const response = await fetch(`/api/music/stream/${cid}`, {
			headers: {
				'X-Encryption-Key': encryptionKey,
				'X-User-Did': did
			}
		});

		if (!response.ok) {
			throw new Error(`Erreur HTTP : ${response.status} - ${await response.text()}`);
		}

		// Extraction des métadonnées
		music.duration = parseFloat(response.headers.get('X-Duration') || '0');
		music.title = response.headers.get('X-Title');

		// Initialisation du streaming audio
		const reader = response.body?.getReader();
		if (reader) {
			music.initializeStreaming(reader);
		} else {
			throw new Error('Erreur : Lecture du flux audio impossible.');
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
		setStatus(`Erreur : ${errorMessage}`);
		music.status.message = errorMessage;
		music.status.success = false;
	}

	return music;
}

/**
 * Récupère les pistes audio associées à l'utilisateur authentifié.
 * @returns Une liste de pistes ou une exception en cas d'erreur.
 */
export async function fetchUserTracks(): Promise<any[]> {
	const { did } = userProfile.value;

	if (!did) {
		throw new Error('Erreur : Utilisateur non authentifié.');
	}

	try {
		const response = await fetch('/api/music/user-tracks', {
			headers: { 'X-User-Did': did }
		});

		if (!response.ok) {
			throw new Error(`Erreur HTTP : ${response.status} - ${await response.text()}`);
		}

		const data = await response.json();

		if (!data.success) {
			throw new Error('Erreur : Impossible de récupérer les pistes utilisateur.');
		}

		return data.tracks;
	} catch (error) {
		setStatus('Erreur lors de la récupération des pistes utilisateur.');
		console.error('Erreur :', error);
		return [];
	}
}
