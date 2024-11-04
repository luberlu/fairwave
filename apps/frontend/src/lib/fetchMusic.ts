import { getAuthenticatedAddress } from './Auth';
import { getEncryptionKey } from './Encryption';
import { Music } from './Music';

export async function fetchMusic(
	cid: string,
	audioElement: HTMLAudioElement | null
): Promise<Music | null> {
	// Vérifier l'élément audio
	if (!audioElement) {
		console.error('Erreur : Élément audio non trouvé.');
		return null;
	}

	// Initialiser l'objet Music
	const music = new Music(audioElement);

	// Récupération de la clé de déchiffrement et de l'adresse de l'utilisateur
	const encryptionKey = getEncryptionKey();
	const storedAddress = getAuthenticatedAddress();

	if (!encryptionKey) {
		music.status.message = 'Erreur : Impossible de récupérer la clé de déchiffrement.';
		return music;
	}
	if (!storedAddress) {
		music.status.message = 'Erreur : Utilisateur non authentifié.';
		return music;
	}

	try {
		// Requête pour récupérer le fichier audio
		const response = await fetch(`/api/music/stream/${cid}`, {
			headers: {
				'X-Encryption-Key': encryptionKey,
				'X-User-Address': storedAddress
			}
		});

		if (!response.ok) throw new Error(await response.text());

		// Extraction des métadonnées
		music.duration = parseFloat(response.headers.get('X-Duration') || '0');
		music.title = response.headers.get('X-Title');

		// Démarrer le streaming audio
        const reader = response.body?.getReader() || null;
        music.initializeStreaming(reader);
	} catch (error) {
		if (error instanceof Error) {
			music.status.message = `Erreur : ${error.message}`;
		} else {
			music.status.message = "Erreur inconnue lors du chargement de l'audio.";
		}

		music.status.success = false;
	}

	return music;
}

export async function fetchUserTracks() {
	const storedAddress = getAuthenticatedAddress();

	if (!storedAddress) {
		throw new Error('Utilisateur non authentifié');
	}

	const response = await fetch('/api/music/user-tracks', {
		headers: { 'X-User-Address': storedAddress }
	});
	const data = await response.json();
	console.log('data => ', data);
	return data.success ? data.tracks : [];
}
