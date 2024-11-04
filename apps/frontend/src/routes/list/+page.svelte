<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchUserTracks } from '../../lib/music/actions/fetchMusic';
    import AudioPlayer from '../../components/AudioPlayer.svelte';
	import { getEncryptionKey } from '$lib/auth/EncryptionKey';

    let tracks: string[] = [];
    let statusMessage: string = 'Chargement des morceaux...';
    let encryptionKey: string | null = null;

    async function loadUserTracks() {
        try {
            const result = await fetchUserTracks();
            if (result.length > 0) {
                tracks = result;
                statusMessage = ''; // Efface le message si des morceaux sont trouvés

                // Récupère la clé de déchiffrement pour tous les morceaux
                encryptionKey = getEncryptionKey();
                if (!encryptionKey) {
                    statusMessage = "Erreur : Impossible de générer la clé de déchiffrement.";
                }
            } else {
                statusMessage = 'Aucun morceau trouvé.';
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des morceaux:', error);
            statusMessage = 'Erreur lors de la récupération des morceaux.';
        }
    }

    onMount(() => {
        loadUserTracks();
    });
</script>

<div class="p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">Mes morceaux</h2>

    <!-- Statut de chargement ou message d'erreur -->
    {#if statusMessage}
        <p class="text-sm text-gray-600 mb-4">{statusMessage}</p>
    {/if}

    <!-- Affichage de la liste des morceaux -->
    {#if tracks.length > 0}
        <ul class="space-y-2">
            {#each tracks as track}
                <li class="border p-2 rounded-md bg-gray-100">
                    CID: {track}
                    <AudioPlayer cid={track} />
                </li>
            {/each}
        </ul>
    {/if}
</div>
