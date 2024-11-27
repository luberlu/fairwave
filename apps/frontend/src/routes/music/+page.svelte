<script lang="ts">
    import { onMount } from 'svelte';
    import { fetchAllTracks, type MusicTrack } from '../../lib/music/actions/fetchMusic'; // Assurez-vous que cette fonction existe côté front
	import AudioPlayer from '../../components/AudioPlayer.svelte';

    let groupedTracks: Record<string, MusicTrack[]> = {};
    let statusMessage: string = 'Chargement des morceaux...';

    /**
     * Classe les morceaux par `artistDid`.
     */
    function groupByArtist(tracks: MusicTrack[]): Record<string, MusicTrack[]> {
        return tracks.reduce((acc, track) => {
            if (!acc[track.artistDid]) {
                acc[track.artistDid] = [];
            }
            acc[track.artistDid].push(track);
            return acc;
        }, {} as Record<string, MusicTrack[]>);
    }

    /**
     * Charge la liste de tous les morceaux.
     */
    async function loadTracks() {
        try {
            const result = await fetchAllTracks();
            if (result.success && result.tracks.length > 0) {
                groupedTracks = groupByArtist(result.tracks);
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

<style>
    .artist-section {
        margin-bottom: 2rem;
    }

    .artist-title {
        font-size: 1.25rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
    }

    .track-item {
        padding: 1rem;
        border-radius: 0.375rem;
        background-color: #f8fafc; /* Light gray */
        border: 1px solid #e5e7eb; /* Gray border */
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* Subtle shadow */
    }
</style>

<div class="p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">Tous les morceaux</h2>

    <!-- Statut de chargement ou message d'erreur -->
    {#if statusMessage}
        <p class="text-sm text-gray-600 mb-4">{statusMessage}</p>
    {/if}

    <!-- Affichage des morceaux classés par `artistDid` -->
    {#if Object.keys(groupedTracks).length > 0}
        <div>
            {#each Object.entries(groupedTracks) as [artistDid, tracks]}
                <div class="artist-section">
                    <div class="artist-title text-blue-500">
                        Artiste DID: {artistDid}
                    </div>
                    <ul class="space-y-4">
                        {#each tracks as track}
                            <li class="track-item">
                                <div class="mb-2">
                                    <h3 class="text-lg font-semibold">{track.title}</h3>
                                    <p class="text-lg font-semibold">{track.cid}</p>
                                    {#if track.duration}
                                        <p class="text-sm text-gray-500">Durée: {Math.round(track.duration)} secondes</p>
                                    {/if}
                                    {#if track.timestamp}
                                        <p class="text-sm text-gray-500">Ajouté le: {new Date(track.timestamp).toLocaleString()}</p>
                                    {/if}
                                </div>
                                <!-- Composant pour lire le morceau -->
                                <AudioPlayer cid={track.cid} />
                            </li>
                        {/each}
                    </ul>
                </div>
            {/each}
        </div>
    {/if}
</div>
