<!-- PassphraseInput.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { initializeEncryptionKey, status } from '../lib/authStore';

	export let passphrase = '';
	const dispatch = createEventDispatcher();

	async function handleSubmit() {
		if (passphrase) {
			await initializeEncryptionKey(passphrase);
			status.set("Clé de chiffrement générée avec succès !");
			dispatch('submit'); // Envoie un événement 'submit' pour notifier le parent
		} else {
			status.set("Veuillez entrer une passphrase valide.");
		}
	}
</script>

<div class="mt-8 p-6 bg-blue-700 text-white rounded-lg shadow-lg max-w-2xl mx-auto">
	<h2 class="text-xl font-bold mb-4">Configuration de la sécurité de votre compte</h2>
	<p class="mb-4">
		Pour sécuriser vos créations, nous avons besoin de générer une clé de chiffrement qui protégera vos données.
		Veuillez entrer une <span class="font-semibold">passphrase unique</span>. Notez bien cette passphrase,
		car elle sera utilisée pour accéder à vos fichiers de manière sécurisée. <span class="font-bold">Ne la perdez pas</span> :
		nous ne pourrons pas la récupérer pour vous.
	</p>
	<p class="mb-4">
		Cette passphrase est <span class="font-semibold">indispensable</span> pour déchiffrer vos données en cas de besoin.
		Assurez-vous de la conserver en lieu sûr, par exemple dans un gestionnaire de mots de passe ou en l’écrivant sur un support fiable.
	</p>
	<div class="flex items-center mb-4">
		<input
			type="text"
			bind:value={passphrase}
			class="rounded-md p-2 w-full text-black"
			placeholder="Entrez votre passphrase"
		/>
		<button on:click={handleSubmit} class="ml-4 rounded-md bg-green-500 p-2 px-4 text-white font-semibold">
			Valider
		</button>
	</div>
	<p class="text-sm text-gray-300">
		<strong>Note :</strong> En validant, vous acceptez de prendre la responsabilité de sécuriser votre passphrase.
	</p>
</div>
