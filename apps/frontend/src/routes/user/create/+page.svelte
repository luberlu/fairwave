<script lang="ts">
	import { setStatus } from '../../../lib/status/StatusStore'; // Si `statusStore` est utilisé
	import PassphraseInput from '../../../components/PassphraseInput.svelte';
	import { goto } from '$app/navigation';
	import { initializeEncryptionKey } from '$lib/auth/EncryptionKey';
	import { updateUser } from '$lib/user/UserActions';

	let step = 1; // Étape actuelle
	let role = ""; // Rôle choisi par l'utilisateur (Listener ou Artist)
	let username = ""; // Nom d'utilisateur
	let artistName = ""; // Nom d'artiste pour les artistes
	let passphrase = ""; // Passphrase pour les artistes

	/**
	 * Gestion de la sélection du rôle et transition vers l'étape suivante.
	 */
	function handleRoleSelection(selectedRole: string): void {
		role = selectedRole;
		step = 2;
	}

	/**
	 * Retour à l'étape précédente.
	 */
	function goBack(): void {
		if (step > 1) step -= 1;
	}

	/**
	 * Validation et soumission des informations de profil.
	 */
	async function handleSubmit(): Promise<void> {
		if (!username.trim()) {
			setStatus("Veuillez entrer un nom d'utilisateur.");
			return;
		}

		if (role === "Artist" && !artistName.trim()) {
			setStatus("Veuillez entrer un nom d'artiste.");
			return;
		}

		try {
			// Si l'utilisateur est un artiste avec une passphrase, initialiser la clé de chiffrement
			if (role === "Artist" && passphrase.trim()) {
				await initializeEncryptionKey(passphrase);
			}

			// Mise à jour des informations utilisateur
			await updateUser({
				role,
				username: username.trim(),
				artistName: role === "Artist" ? artistName.trim() : undefined,
			});

			// Redirection vers le profil utilisateur
			goto('/user/profile');
		} catch (error) {
			console.error("Erreur lors de la mise à jour du profil utilisateur :", error);
			setStatus("Erreur lors de la mise à jour du profil utilisateur.");
		}
	}
</script>

<main class="flex flex-col items-center justify-center min-h-screen">
	<h1 class="text-2xl font-bold mb-4">Création de votre profil</h1>

	{#if step === 1}
		<!-- Étape 1 : Sélection du rôle -->
		<h2 class="text-xl mb-4">Êtes-vous un artiste ou un listener ?</h2>
		<div class="flex space-x-4">
			<button 
				onclick={() => handleRoleSelection('Listener')} 
				class="rounded-md bg-blue-500 p-2 text-white"
				aria-label="Sélectionner Listener">
				Listener
			</button>
			<button 
				onclick={() => handleRoleSelection('Artist')} 
				class="rounded-md bg-green-500 p-2 text-white"
				aria-label="Sélectionner Artist">
				Artiste
			</button>
		</div>
	{/if}

	{#if step === 2}
		<!-- Étape 2 : Informations supplémentaires -->
		<div class="mt-8 p-6 bg-blue-700 text-white rounded-lg shadow-lg max-w-2xl mx-auto">
			<label class="block mb-4">
				<span class="text-lg">Nom d'utilisateur</span>
				<input
					type="text"
					bind:value={username}
					class="mt-2 rounded-md p-2 w-full text-black"
					placeholder="Entrez votre nom d'utilisateur"
					aria-label="Nom d'utilisateur"
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
						aria-label="Nom d'artiste"
					/>
				</label>
				<PassphraseInput isFirstTime passphrase={passphrase} />
			{/if}

			<div class="flex justify-between">
				<button 
					onclick={goBack} 
					class="rounded-md bg-gray-500 p-2 text-white font-semibold"
					aria-label="Retour">
					Retour
				</button>
				<button 
					onclick={handleSubmit} 
					class="rounded-md bg-green-500 p-2 text-white font-semibold"
					aria-label="Valider">
					Valider
				</button>
			</div>
		</div>
	{/if}
</main>
