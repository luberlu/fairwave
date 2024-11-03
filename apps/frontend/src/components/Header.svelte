<script lang="ts">
	import {
		address,
		status,
		isAuthenticated,
		authenticate,
		checkAuthentication,
		encryptionKey,
		initializeEncryptionKey,
	} from '../lib/authStore';
	import UserInfos from './UserInfos.svelte';
	import { onMount } from 'svelte';

	let showStatus = false;
	let showPassphraseInput = false;
	let passphrase = '';

	onMount(() => {
		checkAuthentication();
	});

	// Bloc réactif pour afficher le champ de passphrase lorsque l'utilisateur est authentifié mais sans clé de chiffrement
	$: showPassphraseInput = $isAuthenticated && !$encryptionKey;

	function logout() {
		address.set('');
		isAuthenticated.set(false);
		encryptionKey.set(null);
		localStorage.removeItem('userAddress');
		localStorage.removeItem('encryptionKey');
		status.set('Déconnecté avec succès.');
		showStatusMessage();
	}

	function showStatusMessage() {
		showStatus = true;
		setTimeout(() => {
			showStatus = false;
			status.set('');
		}, 3000);
	}

	async function setEncryptionKey() {
		if (passphrase) {
			await initializeEncryptionKey(passphrase);
			showPassphraseInput = false;
			status.set("Clé de chiffrement générée avec succès !");
			showStatusMessage();
		} else {
			status.set("Veuillez entrer une passphrase valide.");
			showStatusMessage();
		}
	}
</script>

<header class="bg-blue-700 p-4 text-white shadow-md">
	<div class="container mx-auto flex items-center justify-between">
		<h1 class="text-2xl font-bold">Fairwave</h1>
		<div class="flex items-center space-x-4">
			<nav class="flex space-x-4">
				<a href="/" class="hover:underline">Accueil</a>
				<a href="/upload" class="hover:underline">Upload</a>
				<a href="/get" class="hover:underline">Play</a>
				<a href="/list" class="hover:underline">List</a>
			</nav>
			{#if $isAuthenticated}
				<UserInfos {address} />
				<button on:click={logout} class="rounded-md bg-red-500 p-2 text-white">
					Déconnexion
				</button>
			{:else}
				<button on:click={authenticate} class="rounded-md bg-blue-500 p-2 text-white">
					Se connecter avec MetaMask
				</button>
			{/if}
		</div>
	</div>

	{#if showPassphraseInput}
		<div class="mt-4 p-4 bg-blue-600 text-white rounded-md">
			<p class="mb-2">Veuillez entrer une passphrase pour sécuriser votre compte :</p>
			<input
				type="text"
				bind:value={passphrase}
				class="rounded-md p-2 text-black"
				placeholder="Votre passphrase"
			/>
			<button on:click={setEncryptionKey} class="ml-2 rounded-md bg-green-500 p-2 text-white">
				Valider
			</button>
		</div>
	{/if}

	{#if showStatus && $status}
		<div class="mt-2 rounded-md bg-blue-500 p-2 text-center text-white">
			{$status}
		</div>
	{/if}
</header>
