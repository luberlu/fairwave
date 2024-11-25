<script lang="ts">
	import { goto } from '$app/navigation';
	import { userProfile } from '$lib/user/UserStore.svelte';

	// Fonction pour rediriger vers la page de profil
	function goToProfile() {
		goto('/user/profile');
	}
</script>

<div class="flex items-center">
	<p>
		Hello, 
		<button on:click={goToProfile} class="font-semibold text-white-500 underline cursor-pointer hover:text-yellow-400">
			{userProfile.username}
        </button>!
	</p>
</div>
