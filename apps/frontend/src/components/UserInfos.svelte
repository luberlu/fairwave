<script lang="ts">
	import { username } from '../lib/user/UserStore';
	import { goto } from '$app/navigation';

	// Fonction pour rediriger vers la page de profil
	function goToProfile() {
		goto('/user/profile');
	}
</script>

<div class="flex items-center">
	<p>
		Hello, 
		<button onclick={goToProfile} class="font-semibold text-white-500 underline cursor-pointer hover:text-yellow-400">
			{$username}
        </button>!
	</p>
</div>
