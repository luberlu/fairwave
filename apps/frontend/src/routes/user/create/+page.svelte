<script lang="ts">
	import { status } from '../../../lib/user/UserStore';
	import PassphraseInput from '../../../components/PassphraseInput.svelte';
	import { goto } from '$app/navigation';
	import { initializeEncryptionKey } from '$lib/auth/EncryptionKey';
	import { updateUserProfile } from '$lib/auth/Auth';

	let step = 1; // Indique l'étape actuelle (1 pour sélection de rôle, 2 pour informations de profil)
	let role = ""; // Rôle choisi par l'utilisateur (Listener ou Artist)
	let username = ""; // Nom d'utilisateur requis pour tous
	let artistName = ""; // Nom d'artiste, requis uniquement pour les artistes
	let passphrase = ""; // Passphrase, nécessaire uniquement pour les artistes

	// Gestion de la sélection du rôle et transition vers l'étape suivante
	function handleRoleSelection(selectedRole: string) {
		role = selectedRole;
		step = 2; // Passe à l'étape suivante
	}

	// Permet de revenir à l'étape précédente
	function goBack() {
		if (step > 1) step -= 1;
	}

	// Soumet le profil utilisateur en utilisant la fonction `updateUserProfile` d'Auth.js
	async function handleSubmit() {
		if (!username) {
			status.set("Veuillez entrer un nom d'utilisateur.");
			return;
		}

		if (role === "Artist" && passphrase) {
			await initializeEncryptionKey(passphrase); // Initialise la clé de chiffrement pour les artistes
		}

		try {
			// Met à jour le profil utilisateur en passant les informations
			await updateUserProfile({ role, username, artistName: role === "Artist" ? artistName : undefined });
			goto('/user/profile'); // Redirige vers le profil après mise à jour
		} catch (error) {
			console.error("Erreur lors de la mise à jour du profil utilisateur :", error);
			status.set("Erreur lors de la mise à jour du profil utilisateur.");
		}
	}
</script>

<main class="flex flex-col items-center justify-center min-h-screen">
	<h1 class="text-2xl font-bold mb-4">Création de votre profil</h1>

	{#if step === 1}
		<!-- Étape 1 : Sélection du rôle de l'utilisateur -->
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

	{#if step === 2}
		<!-- Étape 2 : Informations de profil supplémentaires -->
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

			<div class="flex justify-between">
				<button on:click={goBack} class="rounded-md bg-gray-500 p-2 text-white font-semibold">
					Retour
				</button>
				<button on:click={handleSubmit} class="rounded-md bg-green-500 p-2 text-white font-semibold">
					Valider
				</button>
			</div>
		</div>
	{/if}
</main>
