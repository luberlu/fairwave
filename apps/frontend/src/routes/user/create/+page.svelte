<script lang="ts">
	import { status } from '../../../lib/user/UserStore';
	import PassphraseInput from '../../../components/PassphraseInput.svelte';
	import { goto } from '$app/navigation';
	import { initializeEncryptionKey } from '$lib/auth/EncryptionKey';

	let role = ""; // Rôle choisi par l'utilisateur (Listener ou Artist)
	let username = ""; // Nom d'utilisateur requis pour tous
	let artistName = ""; // Nom d'artiste, requis uniquement pour les artistes
	let passphrase = ""; // Passphrase, nécessaire uniquement pour les artistes
	let showArtistFields = false; // Affiche le champ pour nom d'artiste et passphrase pour les artistes

	// Gère la sélection du rôle et l'affichage des champs appropriés
	function handleRoleSelection(selectedRole: string) {
		role = selectedRole;
		showArtistFields = role === "Artist"; // Affiche le champ de passphrase et nom d'artiste si le rôle est Artiste
	}

	// Soumet le profil utilisateur
	async function handleSubmit() {
		if (!username) {
			status.set("Veuillez entrer un nom d'utilisateur.");
			return;
		}
		if (role === "Artist" && passphrase) {
			await initializeEncryptionKey(passphrase); // Initialise la clé de chiffrement pour les artistes
		}

		// Récupère le DID de l'utilisateur depuis localStorage
		const did = localStorage.getItem('userDID');
		if (!did) {
			status.set("Erreur : Impossible de récupérer l'identifiant utilisateur.");
			return;
		}

		// Envoie les informations de profil au backend pour stockage
		try {
			const response = await fetch('http://localhost:3000/auth/store-profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ did, role, username, artistName: role === "Artist" ? artistName : undefined }),
			});
			const data = await response.json();

			if (data.success) {
				goto('/user/profil'); // Redirige vers le profil après création
			} else {
				status.set("Erreur lors de la création du profil.");
			}
		} catch (error) {
			console.error("Erreur lors de la création du profil utilisateur :", error);
			status.set("Erreur lors de la création du profil utilisateur.");
		}
	}
</script>

<main class="flex flex-col items-center justify-center min-h-screen">
	<h1 class="text-2xl font-bold mb-4">Création de votre profil</h1>

	{#if !role}
		<!-- Sélection du rôle de l'utilisateur -->
		<h2 class="text-xl mb-4">Êtes-vous un artiste ou un listener ?</h2>
		<div class="flex space-x-4">
			<button on:click={() => handleRoleSelection('Listener')} class="rounded-md bg-blue-500 p-2 text-white">
				Listener
			</button>
			<button on:click={() => handleRoleSelection('Artist')} class="rounded-md bg-green-500 p-2 text-white">
				Artiste
			</button>
		</div>
	{/if}

	{#if role}
		<!-- Informations de profil supplémentaires -->
		<div class="mt-8 p-6 bg-blue-700 text-white rounded-lg shadow-lg max-w-2xl mx-auto">
			<label class="block mb-4">
				<span class="text-lg">Nom d'utilisateur</span>
				<input
					type="text"
					bind:value={username}
					class="mt-2 rounded-md p-2 w-full text-black"
					placeholder="Entrez votre nom d'utilisateur"
				/>
			</label>

			{#if role === 'Artist'}
				<label class="block mb-4">
					<span class="text-lg">Nom d'artiste</span>
					<input
						type="text"
						bind:value={artistName}
						class="mt-2 rounded-md p-2 w-full text-black"
						placeholder="Entrez votre nom d'artiste"
					/>
				</label>
				<PassphraseInput bind:passphrase />
			{/if}

			<button on:click={handleSubmit} class="mt-4 rounded-md bg-green-500 p-2 text-white font-semibold">
				Valider
			</button>
		</div>
	{/if}
</main>
