<script lang="ts">
	import { playerState, updatePlayerState } from '$lib/player/playerStore';
	import { fetchAllTracks, type MusicTrack } from '$lib/music/actions/fetchMusic';
	import { onMount } from 'svelte';
	import { formatTime } from '$lib/utils/time';

	let groupedTracks: Record<string, MusicTrack[]> = {};
	let statusMessage: string = 'Chargement des morceaux...';

	/**
	 * Groups tracks by `artistDid`.
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
	 * Loads and groups tracks.
	 */
	async function loadTracks() {
		try {
			const result = await fetchAllTracks();
			if (result.success && result.tracks.length > 0) {
				groupedTracks = groupByArtist(result.tracks);
				statusMessage = ''; // Clear the message if tracks are found
			} else {
				statusMessage = 'Aucun morceau trouvé.';
			}
		} catch (error) {
			console.error('Erreur lors de la récupération des morceaux:', error);
			statusMessage = 'Erreur lors de la récupération des morceaux.';
		}
	}

	/**
	 * Handles track selection by updating the global player state.
	 */
	function playTrack(track: MusicTrack) {
		updatePlayerState({
			cid: track.cid,
			metadata: track,
			isPlaying: true,
			currentTime: 0, // Reset playback position
		});
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
		width: 100%;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding: 1rem;
        background-color: #232323;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		cursor: pointer;
		transition: background-color 0.2s;
	}

    .track-item-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;

        .left {
            display: flex;

            span {
                margin: 0 0.4rem;
            }
        }

        .right {
            display: flex;
        }
    }

	.track-item:hover {
		background-color: #1c1c1c;
	}

    h2 {
        border-bottom: solid 1px white;
    }
</style>

<div class="p-6 text-white">
	<h2 class="text-1xl font-bold mb-4">All tracks</h2>

	<!-- Status message -->
	{#if statusMessage}
		<p class="text-sm text-gray-600 mb-4">{statusMessage}</p>
	{/if}

	<!-- Display tracks grouped by artist -->
	{#if Object.keys(groupedTracks).length > 0}
		<div>
			{#each Object.entries(groupedTracks) as [artistDid, tracks]}
				<div class="artist-section">
					<div class="artist-title text-white">Artiste DID: {artistDid}</div>
					<ul class="space-y-4">
						{#each tracks as track}
							<li>
								<button
									type="button"
									class="track-item"
									on:click={() => playTrack(track)}
									on:keydown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') {
											playTrack(track);
											event.preventDefault(); // Prevent default scroll behavior for Space
										}
									}}
								>
									<div class="track-item-inner">
                                        <div class="left">
                                            <h3 class="text-lg font-semibold">{track.title}</h3>
                                            <span>-</span>
                                            <h4 class="text-lg font-semibold">{track.artist}</h4>
                                        </div>
                                        <div class="right">
                                            {#if track.duration}
											    <p class="text-sm text-gray-500">{formatTime(track.duration)}</p>
										    {/if}
                                        </div>
									</div>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{/if}
</div>