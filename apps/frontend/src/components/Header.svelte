<script lang="ts">
	import { goto } from '$app/navigation';
	import { logout } from '../lib/user/UserActions';
	import { status, isAuthenticated } from '../lib/user/UserStore';
	import UserInfos from './UserInfos.svelte';

	let showStatus = false;

	// Méthode de déconnexion
	function handleLogout() {
		logout();
		goto('/');
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
				<button onclick={handleLogout} class="rounded-md bg-red-500 p-2 text-white">
					Log out
				</button>
			{:else}
				<a href="/connect" class="rounded-md bg-blue-500 p-2 text-white">Log In</a>
			{/if}
		</div>
	</div>

	<!-- Affiche PassphraseInput seulement si l'utilisateur est authentifié sans clé de chiffrement
	{#if $isAuthenticated && !$encryptionKey}
		<PassphraseInput />
	{/if}*/-->

	{#if showStatus && $status}
		<div class="mt-2 rounded-md bg-blue-500 p-2 text-center text-white">
			{$status}
		</div>
	{/if}
</header>
