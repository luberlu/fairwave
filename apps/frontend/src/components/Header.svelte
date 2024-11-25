<script lang="ts">
	import { goto } from '$app/navigation';
	import { logout } from '../lib/user/UserActions';
	import { statusStore } from '../lib/status/StatusStore';
	import { authStore } from '$lib/auth/AuthStore';
	import UserInfos from './UserInfos.svelte';

	function handleLogout() {
		logout();
		goto('/');
	}
</script>

<header class="bg-blue-700 p-4 text-white shadow-md">
	<div class="container mx-auto flex items-center justify-between">
		<h1 class="text-2xl font-bold">Fairwave</h1>
		<div class="flex items-center space-x-4">
			<nav class="flex space-x-4">
				<a href="/" class="hover:underline">Accueil</a>
				<a href="/music" class="hover:underline">Music</a>
				<a href="/upload" class="hover:underline">Upload</a>
				<a href="/get" class="hover:underline">Play</a>
				<a href="/list" class="hover:underline">My Music</a>
			</nav>
			{#if $authStore.isAuthenticated}
				<UserInfos />
				<button onclick={handleLogout} class="rounded-md bg-red-500 p-2 text-white">
					Log out
				</button>
			{:else}
				<a href="/connect" class="rounded-md bg-blue-500 p-2 text-white">Log In</a>
			{/if}
		</div>
	</div>

	{#if $statusStore.message}
		<div class="mt-2 rounded-md bg-blue-500 p-2 text-center text-white">
			{$statusStore.message}
		</div>
	{/if}
</header>
