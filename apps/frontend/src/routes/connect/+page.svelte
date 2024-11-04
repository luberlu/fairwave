<script lang="ts">
	import { onMount } from 'svelte';
	import { authenticate } from '../../lib/auth/Auth';

	onMount(async () => {
		await authenticate();
	});
</script>

<main class="flex flex-col items-center justify-center min-h-screen">
	<h1 class="text-2xl font-bold mb-4">Connexion en cours avec MetaMask...</h1>
	<p>Merci de patienter pendant l'authentification.</p>
</main>
