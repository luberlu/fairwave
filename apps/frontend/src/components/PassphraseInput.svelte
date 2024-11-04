<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { initializeEncryptionKey } from '../lib/auth/EncryptionKey';
	import { status } from '../lib/user/UserStore';
	import CryptoJS from 'crypto-js';

	export let passphrase = '';
	const dispatch = createEventDispatcher();

	// Génère une clé de chiffrement aléatoire et l'affiche
	async function generatePassphrase() {
		passphrase = CryptoJS.lib.WordArray.random(16).toString(); // Génère une nouvelle passphrase aléatoire
		await initializeEncryptionKey(passphrase);
		status.set("Nouvelle clé de chiffrement générée avec succès !");
		dispatch('submit'); // Envoie un événement 'submit' pour notifier le parent
	}
</script>

<div class="mt-8 p-6 bg-blue-700 text-white rounded-lg shadow-lg max-w-2xl mx-auto">
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
		<button on:click={generatePassphrase} class="ml-4 rounded-md bg-yellow-500 p-2 px-4 text-white font-semibold">
			Générer une nouvelle clé
		</button>
	</div>
	<p class="text-sm text-gray-300 mt-2">
		<strong>Note :</strong> Sauvegardez cette clé dans un endroit sûr. Elle est essentielle pour l'accès à vos données chiffrées.
	</p>
</div>
