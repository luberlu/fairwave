<!-- /connect/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { authenticate } from '../../lib/auth/Auth';
	import { isAuthenticated } from '../../lib/user/UserStore';
	import { goto } from '$app/navigation';

	// Lance l'authentification lorsque le composant est monté
	onMount(async () => {
		await authenticate();

		// Si l'utilisateur est authentifié, déterminer la redirection
		if ($isAuthenticated) {
			const userExists = await checkUserExists(); // Vérifie si le profil existe

			if (userExists) {
				goto('/user/profil'); // Redirige vers le profil si l'utilisateur existe
			} else {
				goto('/user/create'); // Redirige vers la création de profil si nouveau
			}
		} else {
			// En cas d'échec d'authentification, retourner à l'accueil ou afficher un message d'erreur
			goto('/');
		}
	});

	// Fonction pour vérifier l'existence de l'utilisateur dans la base de données
	async function checkUserExists(): Promise<boolean> {
		// Récupère le DID depuis l’authentification
		const did = localStorage.getItem('userDID');
		if (!did) return false;

		// Effectue une requête vers le backend pour vérifier si le profil utilisateur existe
		try {
			const response = await fetch(`http://localhost:3000/auth/get-profile/${encodeURIComponent(did)}`);
			const data = await response.json();
			return data.success && data.profile !== null;
		} catch (error) {
			console.error("Erreur lors de la vérification de l'existence du profil utilisateur :", error);
			return false;
		}
	}
</script>

<main class="flex flex-col items-center justify-center min-h-screen">
	<h1 class="text-2xl font-bold mb-4">Connexion en cours avec MetaMask...</h1>
	<p>Merci de patienter pendant l'authentification.</p>
</main>
