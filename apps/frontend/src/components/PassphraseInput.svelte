<script lang="ts">
	import { initializeEncryptionKey } from '../lib/auth/EncryptionKey';
	import { status } from '../lib/user/UserStore';
	import CryptoJS from 'crypto-js';

	interface Props {
		submit?: () => void,
  		passphrase?: string,
  		isFirstTime?: Boolean,
	};

	let { submit = () => {}, passphrase = '', isFirstTime = false } : Props = $props();

	// Génère une nouvelle passphrase aléatoire pour l'utilisateur lors de la première connexion
	async function generatePassphrase() {
		passphrase = CryptoJS.lib.WordArray.random(16).toString();
		await initializeEncryptionKey(passphrase);
		status.set("Nouvelle clé de chiffrement générée avec succès !");
		submit();
	}

	// Soumet la passphrase existante pour la réauthentification
	async function submitExistingPassphrase(event: any) {
		event.preventDefault(); // Empêche le rechargement de la page
		if (passphrase) {
			await initializeEncryptionKey(passphrase);
			status.set("Clé de chiffrement validée avec succès !");
			submit();
		} else {
			status.set("Veuillez entrer une passphrase valide.");
		}
	}
</script>

<div class="mt-8 p-6 bg-blue-700 text-white rounded-lg shadow-lg max-w-2xl mx-auto">
	{#if isFirstTime}
		<!-- Mode première connexion : Génère une nouvelle passphrase -->
		<h2 class="text-xl font-bold mb-4">Configuration de la sécurité de votre compte</h2>
		<p class="mb-4">
			Pour sécuriser vos créations, nous allons générer une <span class="font-semibold">passphrase unique</span> pour chiffrer vos données.
			Assurez-vous de la conserver en lieu sûr, car elle sera <span class="font-bold">indispensable</span> pour accéder à vos fichiers de manière sécurisée.
			<strong class="block mt-2 text-red-300">Attention : Vous devrez utiliser cette clé à chaque connexion. Ne la perdez pas !</strong>
		</p>
		<div class="flex items-center mb-4">
			<input
				type="text"
				bind:value={passphrase}
				class="rounded-md p-2 w-full text-black"
				placeholder="Passphrase générée"
				readonly
			/>
			<button onclick={generatePassphrase} class="ml-4 rounded-md bg-yellow-500 p-2 px-4 text-white font-semibold">
				Générer une nouvelle clé
			</button>
		</div>
		<p class="text-sm text-gray-300 mt-2">
			<strong>Note :</strong> Sauvegardez cette clé dans un endroit sûr. Elle est essentielle pour l'accès à vos données chiffrées.
		</p>
	{:else}
		<!-- Mode reconnexion : L'utilisateur entre sa clé existante -->
		<h2 class="text-xl font-bold mb-4">Connexion sécurisée</h2>
		<p class="mb-4">
			Pour accéder à vos données, veuillez entrer votre <span class="font-semibold">passphrase</span> déjà sauvegardée.
			Assurez-vous qu'elle soit correcte, car elle est <span class="font-bold">indispensable</span> pour déchiffrer vos informations.
		</p>
		<form onsubmit={submitExistingPassphrase} class="flex items-center mb-4">
			<input
				type="password"
				bind:value={passphrase}
				class="rounded-md p-2 w-full text-black"
				placeholder="Entrez votre passphrase"
				required
			/>
			<button type="submit" class="ml-4 rounded-md bg-green-500 p-2 px-4 text-white font-semibold">
				Valider la passphrase
			</button>
		</form>
		<p class="text-sm text-gray-300 mt-2">
			<strong>Note :</strong> Cette passphrase est essentielle pour l'accès à vos données chiffrées. Gardez-la en lieu sûr.
		</p>
	{/if}
</div>
