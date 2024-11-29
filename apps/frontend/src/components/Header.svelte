<script lang="ts">
	import { goto } from '$app/navigation';
	import { logout } from '../lib/user/UserActions';
	import { statusStore } from '../lib/status/StatusStore';
	import { authStore } from '$lib/auth/AuthStore';
	import { userProfile } from '$lib/user/UserStore.svelte';
	import UserInfos from './UserInfos.svelte';

	function handleLogout() {
		logout();
		goto('/');
	}
</script>

<header class="header p-4 text-white shadow-md">
	<div class="container mx-auto flex items-center justify-between">
		<h1 class="logo text-2xl font-bold">
			<span>
				Fairwave
			</span>
			{#if userProfile.value.role === 'Artist'}
				<span class="artist-label">for artist</span>
			{/if}
		</h1>
		<div class="flex items-center space-x-4">
			<nav class="flex space-x-4">
				<a href="/" class="hover:underline">Accueil</a>
				<a href="/music" class="hover:underline">Music</a>
				<!-- Options basées sur le rôle -->
				{#if userProfile.value.role === 'Artist'}
					<a href="/upload" class="hover:underline">Upload</a>
					<a href="/list" class="hover:underline">My Music</a>
				{/if}
				{#if userProfile.value.role === 'Listener'}
					<a href="/favorites" class="hover:underline">Favorites</a>
				{/if}
			</nav>
			<!-- Boutons connexion/déconnexion -->
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

<style>
	.header {
		background-color: #232323;
	}

	.logo {
		display: flex;
		align-items: center;
		color: #d5f029;
	}

	.artist-label {
		font-size: 14px;
		color: white;
		line-height: 14px;
		margin-left: 6px;
		font-weight: 300;
	}
</style>
