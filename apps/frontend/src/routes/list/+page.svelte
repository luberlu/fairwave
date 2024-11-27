<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchUserTracks } from '../../lib/music/actions/fetchMusic';
    import { getEncryptionKey } from '$lib/auth/EncryptionKey';
    import AudioPlayer from './../../components/AudioPlayer.svelte';

    let tracks: string[] = [];
    let statusMessage: string = 'Chargement des morceaux...';
    let encryptionKey: string | null = null;

    /**
     * Charge les morceaux de l'utilisateur et gère les erreurs.
     */
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each tracks as track}
                <div class="border rounded-md p-4 bg-gray-100 shadow hover:shadow-lg transition duration-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">CID</h3>
                    <p class="text-sm text-gray-600 mb-4 break-all">{track}</p>
                    <AudioPlayer cid={track} />
                </div>
            {/each}
        </div>
    {/if}
</div>
