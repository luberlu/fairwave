<script lang="ts">
	import { onMount } from 'svelte';
	import { User } from '../lib/User';
	import {
		address,
		status,
		isAuthenticated,
		encryptionKey,
		checkAuthentication
	} from '../lib/authStore';
	import UserInfos from './UserInfos.svelte';
	import PassphraseInput from './PassphraseInput.svelte';

	let showStatus = false;

	onMount(() => {
		checkAuthentication();
	});

	// Méthode de déconnexion
	function handleLogout() {
		User.logout();
		showStatus = true;
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
				<UserInfos />
				<button on:click={handleLogout} class="rounded-md bg-red-500 p-2 text-white">
					Déconnexion
				</button>
			{:else}
				<button on:click={User.authenticate} class="rounded-md bg-blue-500 p-2 text-white">
					Se connecter avec MetaMask
				</button>
			{/if}
		</div>
	</div>

	<!-- Affiche PassphraseInput seulement si l'utilisateur est authentifié sans clé de chiffrement -->
	{#if $isAuthenticated && !$encryptionKey}
		<PassphraseInput />
	{/if}

	{#if showStatus && $status}
		<div class="mt-2 rounded-md bg-blue-500 p-2 text-center text-white">
			{$status}
		</div>
	{/if}
</header>
