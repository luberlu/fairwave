<script lang="ts">
	import { username, role, artistName, isAuthenticated } from '../../../lib/user/UserStore';
	import { goto } from '$app/navigation';
	import { logout } from '../../../lib/user/UserActions';

	// Déconnecte l'utilisateur et redirige vers la page de connexion
	function handleLogout() {
		logout();
		goto('/');
	}
</script>

<main class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
	<div class="w-full max-w-xl bg-white rounded-lg shadow-md overflow-hidden">
		<div class="bg-blue-600 p-6 text-center text-white">
			<h1 class="text-3xl font-bold">Profil de l'utilisateur</h1>
		</div>
		<div class="p-6">
			<div class="text-center mb-6">
				<img
					src="https://via.placeholder.com/150"
					alt="User Avatar"
					class="w-32 h-32 rounded-full mx-auto border-4 border-blue-500 shadow-md"
				/>
				<h2 class="text-2xl font-semibold mt-4">{$username}</h2>
				<p class="text-gray-500 text-lg">{$role}</p>
			</div>
			
			{#if $role === 'Artist'}
				<div class="text-center mb-6">
					<p class="text-gray-600 text-sm font-medium">Nom d'artiste :</p>
					<p class="text-gray-700 text-xl">{$artistName}</p>
				</div>
			{/if}
			
			<div class="flex justify-around mt-6 space-x-4">
				<button on:click={handleLogout} class="flex-1 rounded-md bg-red-500 p-2 text-white font-semibold hover:bg-red-600 transition">
					Déconnexion
				</button>
				<!--<button on:click={() => goto('/user/edit')} class="flex-1 rounded-md bg-green-500 p-2 text-white font-semibold hover:bg-green-600 transition">
					Modifier le profil
				</button>-->
			</div>
		</div>
	</div>
</main>
