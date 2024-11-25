<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchAllTracks, type MusicTrack } from '../../lib/music/actions/fetchMusic'; // Assurez-vous que cette fonction existe côté front
    import AudioPlayer from '../../components/AudioPlayer.svelte';

    let tracks: MusicTrack[] = [];
    let statusMessage: string = 'Chargement des morceaux...';

    /**
     * Charge la liste de tous les morceaux.
     */
    async function loadTracks() {
        try {
            const result = await fetchAllTracks();
            if (result.success && result.tracks.length > 0) {
                tracks = result.tracks;
                console.log('tracks => ', tracks);
                statusMessage = ''; // Efface le message si des morceaux sont trouvés
            } else {
                statusMessage = 'Aucun morceau trouvé.';
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des morceaux:', error);
            statusMessage = 'Erreur lors de la récupération des morceaux.';
        }
    }

    onMount(() => {
        loadTracks();
    });
</script>

<div class="p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">Tous les morceaux</h2>

    <!-- Statut de chargement ou message d'erreur -->
    {#if statusMessage}
        <p class="text-sm text-gray-600 mb-4">{statusMessage}</p>
    {/if}

    <!-- Affichage de la liste des morceaux -->
    {#if tracks.length > 0}
        <ul class="space-y-4">
            {#each tracks as track}
                <li class="border p-4 rounded-md bg-gray-50 shadow-sm">
                    <div class="mb-2">
                        <h3 class="text-lg font-semibold">{track.title}</h3>
                        <p class="text-sm text-gray-500">Artiste DID: {track.artistDid}</p>
                        {#if track.duration}
                            <p class="text-sm text-gray-500">Durée: {Math.round(track.duration)} secondes</p>
                        {/if}
                        {#if track.timestamp}
                            <p class="text-sm text-gray-500">Ajouté le: {new Date(track.timestamp).toLocaleString()}</p>
                        {/if}
                    </div>
                    <!-- Composant pour lire le morceau -->
                    <!--<AudioPlayer cid={track.cid} />-->
                </li>
            {/each}
        </ul>
    {/if}
</div>
