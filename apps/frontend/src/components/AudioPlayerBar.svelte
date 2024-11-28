<script lang="ts">
	import { onDestroy } from 'svelte';
	import { playerState, updatePlayerState } from '$lib/player/playerStore';
	import { fetchMusic } from '$lib/music/actions/fetchMusic';
	import { Icon, Play, PlayPause } from 'svelte-hero-icons';

	let audioElement = $state<HTMLAudioElement | null>(null);
	let lastPlayedCid: string | null = null;
	let isLoadingTrack = false;

	// Temps formaté pour l'affichage
	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
		return `${minutes}:${secs}`;
	}

	// Charger une piste
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

	// Réagir aux changements de playerState.value.cid
	$effect(() => {
		loadTrack(playerState.value.cid);
	});

	// Mettre à jour le temps actuel
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

	// Lecture/Pause
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

	// Gestion de la barre d'espace pour play/pause
	function handleKeyPress(event: KeyboardEvent) {
		if (event.code === 'Space') {
			event.preventDefault(); // Empêche le défilement de la page lors de l'appui sur Espace
			togglePlay();
		}
	}

	// Avancer/Reculer dans la piste
	function seek(event: MouseEvent | KeyboardEvent) {
		if (audioElement) {
			const progressBar = event.currentTarget as HTMLButtonElement;
			const rect = progressBar.getBoundingClientRect();
			const clickX = event instanceof MouseEvent ? event.clientX - rect.left : rect.width / 2;

			const newTime = (clickX / rect.width) * (audioElement.duration || 0);
			audioElement.currentTime = newTime;
			updatePlayerState({ currentTime: newTime });
		}
	}

	// Nettoyage lors de la destruction du composant
	onDestroy(() => {
		if (audioElement) {
			audioElement.pause();
			audioElement.src = '';
		}
		if(typeof window !== "undefined") document.removeEventListener('keydown', handleKeyPress);
	});

	// Ajouter un écouteur pour les touches clavier
    if(typeof window !== "undefined") document.addEventListener('keydown', handleKeyPress);
</script>

<style>
	.audio-player-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2rem;
		background-color: #f8fafc;
		border-top: 1px solid #e5e7eb;
		box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.05);
		position: fixed;
		bottom: 0;
		width: 100%;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.progress-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.progress-bar {
		width: 100%;
		margin: 0 1rem;
		max-width: 800px;
		background: #e5e7eb;
		height: 8px;
		position: relative;
		cursor: pointer;
	}
	.progress-fill {
		height: 100%;
		background: #3b82f6;
		width: 0;
		transition: width 0.05s linear;
	}
	.timing {
		font-size: 0.875rem;
		color: #6b7280;
		margin-left: 1rem;
		margin-right: 1rem;
	}
</style>

<div class="audio-player-bar">
	<!-- Métadonnées -->
	<div class="metadata">
		<h3>{playerState.value.metadata?.title || 'Unknown Track'}</h3>
		<p>{playerState.value.metadata?.artist || 'Unknown Artist'}</p>
	</div>

	<!-- Barre de progression et timing -->
	<div class="progress-container">
		<div class="timing timing-left">
			{playerState.value.currentTime ? formatTime(playerState.value.currentTime) : '0:00'}
		</div>
		<div class="progress-bar" onclick={seek} onkeydown={seek} role="button" tabindex="0">
			<div
				class="progress-fill"
				style="width: {audioElement?.duration ? (playerState.value.currentTime / (audioElement.duration || 1)) * 100 : 0}%"
			></div>
		</div>
		<div class="timing timing-right">
			{playerState.value.duration ? formatTime(playerState.value.duration) : '0:00'}
		</div>
	</div>

	<!-- Bouton Play/Pause -->
	<div class="controls">
		<button onclick={togglePlay} aria-label={playerState.value.isPlaying ? 'Pause' : 'Play'}>
			<Icon src={playerState.value.isPlaying ? PlayPause : Play} class="h-6 w-6 text-black" />
		</button>
	</div>

	<!-- Élément audio -->
	<audio bind:this={audioElement} ontimeupdate={onTimeUpdate} class="hidden" onloadedmetadata={onMetadataLoaded}></audio>
</div>