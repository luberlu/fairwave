import Hls from 'hls.js';
import { userProfile } from '../../user/UserStore.svelte';
import { setStatus } from '../../status/StatusStore';

export interface MusicTrack {
	cid: string; // Content Identifier sur IPFS
	title: string; // Titre du morceau
	artistDid: string; // DID de l'utilisateur/artiste
	artist?: string; // Nom de l'artiste (métadonnée extraite du fichier)
	album?: string; // Nom de l'album (métadonnée extraite du fichier)
	genre?: string; // Genre musical (métadonnée extraite du fichier)
	year?: number; // Année de publication (métadonnée extraite du fichier)
	duration?: number; // Durée du morceau (métadonnée extraite du fichier)
	timestamp?: string; // Date d'ajout
}

/**
 * Récupère les métadonnées d'une piste musicale.
 * @param cid - L'identifiant de contenu du manifest HLS.
 * @returns Un objet contenant les métadonnées de la piste.
 */
export async function fetchMusicMetadata(cid: string): Promise<MusicTrack | null> {
	try {
		const { did } = userProfile.value;

		// URL pour récupérer les métadonnées
		const response = await fetch(`/api/music/metadata/${cid}`, {
			headers: {
				'X-User-Did': did
			}
		});

		if (!response.ok) {
			throw new Error(`Erreur HTTP : ${response.status} - ${await response.text()}`);
		}

		const metadata: MusicTrack = await response.json();
		return metadata;
	} catch (error) {
		console.error('Erreur lors de la récupération des métadonnées:', error);
		return null;
	}
}

export async function fetchMusic(
	cid: string,
	audioElement: HTMLAudioElement | null
): Promise<void> {
	if (!audioElement) {
		setStatus('Erreur : Élément audio introuvable.');
		return;
	}

	const { did } = userProfile.value;

	if (!did) {
		setStatus('Erreur : Utilisateur non authentifié.');
		return;
	}

	try {
		// Construire l'URL pour le manifeste HLS
		const manifestUrl = `/api/music/stream/${cid}`;

		// Vérifier si HLS est supporté nativement ou utiliser HLS.js
		if (Hls.isSupported()) {
			const hls = new Hls({
				maxBufferLength: 30, // Augmentez ou réduisez selon les besoins
				startLevel: 0, // Charge le niveau le plus bas pour démarrer rapidement
				autoStartLoad: true, // Charge immédiatement
				maxBufferSize: 60 * 1000 * 1000, // Taille max du buffer
			});

			// Charger le manifeste HLS dans HLS.js
			hls.loadSource(manifestUrl);

			// Attacher HLS.js à l'élément audio
			hls.attachMedia(audioElement);

			// Écoute des erreurs
			hls.on(Hls.Events.ERROR, (event, data) => {
				console.error('Erreur HLS.js :', data);
				// setStatus(`Erreur HLS : ${data.details}`);
			});

			// Écoute des événements de chargement
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				//setStatus(`Lecture de la musique : ${cid}`);
				/*audioElement.play().catch((error) => {
					console.error('Erreur lors de la lecture audio :', error);
					setStatus(`Erreur : Impossible de lire l'audio.`);
				});*/
			});
		} else if (audioElement.canPlayType('application/vnd.apple.mpegurl')) {
			// Pour les navigateurs comme Safari avec support HLS natif
			audioElement.src = manifestUrl;
			audioElement.addEventListener('loadedmetadata', () => {
				setStatus(`Lecture de la musique : ${cid}`);
				audioElement.play().catch((error) => {
					console.error('Erreur lors de la lecture audio :', error);
					setStatus(`Erreur : Impossible de lire l'audio.`);
				});
			});
		} else {
			setStatus('Erreur : HLS non pris en charge par ce navigateur.');
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
		console.error('Erreur :', errorMessage);
		// setStatus(`Erreur : ${errorMessage}`);
	}
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

export async function fetchAllTracks(): Promise<{ success: boolean; tracks: MusicTrack[] }> {
	try {
		const response = await fetch(`/api/music/all`, {
			method: 'GET'
		});

		if (!response.ok) {
			throw new Error('Erreur lors de la récupération des morceaux');
		}

		const data = await response.json();
		return { success: true, tracks: data.tracks };
	} catch (error) {
		console.error('Erreur lors de la récupération des morceaux:', error);
		return { success: false, tracks: [] };
	}
}
