<script lang="ts">
	import PassphraseInput from '../../../components/PassphraseInput.svelte';
	import { userProfile } from '../../../lib/user/UserStore.svelte';
	import { authStore } from '../../../lib/auth/AuthStore';
	import { setStatus } from '../../../lib/status/StatusStore';
	import { logout, fetchUser } from '../../../lib/user/UserActions';
	import { goto } from '$app/navigation';

	// Déstructure les informations utilisateur
	const { did, username, role, artistName } = $userProfile;

	// État de validation de la passphrase
	let isPassphraseValidated = $authStore.encryptionKey ? true : false;

	/**
	 * Charge le profil utilisateur après la validation de la passphrase.
	 */
	async function loadUserProfile(): Promise<void> {
		try {
			const userProfileData = await fetchUser(did);

			if (userProfileData) {
				isPassphraseValidated = true;
			} else {
				setStatus('Erreur lors du chargement du profil utilisateur.');
				goto('/user/create');
			}
		} catch (error) {
			console.error('Erreur lors du chargement du profil utilisateur:', error);
			setStatus('Impossible de charger le profil utilisateur.');
		}
	}

	/**
	 * Appelée lorsque la passphrase est soumise avec succès.
	 */
	function onPassphraseSubmit(): void {
		loadUserProfile();
	}

	/**
	 * Déconnecte l'utilisateur et redirige vers la page de connexion.
	 */
	function handleLogout(): void {
		logout();
		goto('/');
	}
</script>

<main class="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
	{#if !isPassphraseValidated}
		<!-- Composant PassphraseInput pour valider l'accès -->
		<PassphraseInput isFirstTime={false} submit={onPassphraseSubmit} />
	{:else}
		<!-- Affichage du profil utilisateur après validation -->
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
					<h2 class="text-2xl font-semibold mt-4">{username}</h2>
					<p class="text-gray-500 text-lg">{role}</p>
				</div>
				
				{#if role === 'Artist'}
					<div class="text-center mb-6">
						<p class="text-gray-600 text-sm font-medium">Nom d'artiste :</p>
						<p class="text-gray-700 text-xl">{artistName}</p>
					</div>
				{/if}
				
				<div class="flex justify-around mt-6 space-x-4">
					<button 
						onclick={handleLogout} 
						class="flex-1 rounded-md bg-red-500 p-2 text-white font-semibold hover:bg-red-600 transition"
						aria-label="Déconnexion">
						Déconnexion
					</button>
					<button 
						onclick={() => goto('/user/edit')} 
						class="flex-1 rounded-md bg-green-500 p-2 text-white font-semibold hover:bg-green-600 transition"
						aria-label="Modifier le profil">
						Modifier le profil
					</button>
				</div>
			</div>
		</div>
	{/if}
</main>
