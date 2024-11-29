<script lang="ts">
	import { onDestroy } from 'svelte';
	import { playerState, updatePlayerState } from '$lib/player/playerStore';
	import { fetchMusic } from '$lib/music/actions/fetchMusic';
	import AudioControls from './AudioControls.svelte';
	import ProgressBar from './ProgressBar.svelte';

	let audioElement = $state<HTMLAudioElement | null>(null);
	let lastPlayedCid: string | null = null;
	let isLoadingTrack = false;

	async function loadTrack(cid: string | null) {
		if (!cid || !audioElement || isLoadingTrack || cid === lastPlayedCid) {
			return;
		}

		isLoadingTrack = true;
		try {
			audioElement.pause();
			audioElement.src = '';

			await fetchMusic(cid, audioElement);
			lastPlayedCid = cid;

			if (playerState.value.currentTime) {
				audioElement.currentTime = playerState.value.currentTime;
			}

			if (playerState.value.isPlaying) {
				audioElement.play();
			}
		} catch (error) {
			console.error('Error loading track:', error);
		} finally {
			isLoadingTrack = false;
		}
	}

	function onTimeUpdate() {
		if (audioElement) {
			updatePlayerState({
				currentTime: audioElement.currentTime,
			});
		}
	}

	function onMetadataLoaded() {
		if (audioElement) {
			updatePlayerState({
				duration: audioElement.duration,
			});
		}
	}

	function onAudioProgress() {
		if (audioElement) {
			let buffered = audioElement.buffered;

			if (buffered.length > 0) {
				const bufferedEnd = buffered.end(buffered.length - 1);

				updatePlayerState({
					buffer: bufferedEnd,
				});
			}
		}
	}

	function togglePlay() {
		if (audioElement) {
			if (audioElement.paused) {
				audioElement.play().then(() => {
					updatePlayerState({ isPlaying: true });
				});
			} else {
				audioElement.pause();
				updatePlayerState({ isPlaying: false });
			}
		}
	}

	onDestroy(() => {
		if (audioElement) {
			audioElement.pause();
			audioElement.src = '';
		}
	});

	$effect(() => {
		loadTrack(playerState.value.cid);
	});
</script>

<div class="audio-player-bar">
	<div class="metadata">
		<h3>{playerState.value.metadata?.title || 'Unknown Track'}</h3>
		<p>{playerState.value.metadata?.artist || 'Unknown Artist'}</p>
	</div>

	<ProgressBar { audioElement } />
	<AudioControls { togglePlay } />

	<audio
		bind:this={audioElement}
		ontimeupdate={onTimeUpdate}
		class="hidden"
		onprogress={onAudioProgress}
		onloadedmetadata={onMetadataLoaded}
	></audio>
</div>

<style>
	.audio-player-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2rem;
		background-color: #232323;
		box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.05);
		position: fixed;
		bottom: 0;
		width: 100%;
	}
	.metadata {
		color:#b7b7b7;

		p {
			font-weight: 500;
			color: white;
		}
	}
</style>
