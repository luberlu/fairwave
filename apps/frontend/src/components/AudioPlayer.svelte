<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fetchMusic, fetchMusicMetadata, type MusicTrack } from '$lib/music/actions/fetchMusic';

	export let cid: string;

	let audioElement: HTMLAudioElement | null = null;
	let statusMessage = '';
	let musicMetadata: MusicTrack | null = null; // Variable pour stocker les métadonnées
	let isAudioReady = false;

	async function initializeAudio() {
		statusMessage = "Chargement de l'audio...";
		try {
			// Récupérer les métadonnées
			musicMetadata = await fetchMusicMetadata(cid);

			if (!musicMetadata) {
				throw new Error('Impossible de charger les métadonnées.');
			}

			// Initialiser HLS.js pour la lecture
			await fetchMusic(cid, audioElement);

			isAudioReady = true; // Active les contrôles et l'affichage
			statusMessage = '';
		} catch (error: any) {
			statusMessage = `Erreur : ${error.message || 'Impossible de charger la musique.'}`;
			isAudioReady = false;
		}
	}

	onMount(() => {
		if (audioElement) {
			initializeAudio();
		}
	});

	onDestroy(() => {
		if (audioElement) {
			audioElement.pause();
			audioElement.src = '';
		}
	});
</script>


<div class="rounded-lg bg-white p-4 shadow-md">
	<!-- Statut de chargement ou erreur -->
	<p class="mb-4 text-sm text-gray-600">{statusMessage}</p>

	<!-- Toujours monter le lecteur audio, mais activer les contrôles lorsque prêt -->
	<audio bind:this={audioElement} controls={isAudioReady} class="w-full">
		<track kind="captions" />
	</audio>

	<!-- Informations audio uniquement lorsque prêt -->
	{#if isAudioReady && musicMetadata}
		<h3 class="mt-4 text-lg font-semibold">Titre : {musicMetadata.title}</h3>

		{#if musicMetadata.artist}
			<p class="text-sm text-gray-700">Artiste : {musicMetadata.artist}</p>
		{/if}

		{#if musicMetadata.album}
			<p class="text-sm text-gray-700">Album : {musicMetadata.album}</p>
		{/if}

		{#if musicMetadata.genre}
			<p class="text-sm text-gray-700">Genre : {musicMetadata.genre}</p>
		{/if}

		{#if musicMetadata.year}
			<p class="text-sm text-gray-700">Année : {musicMetadata.year}</p>
		{/if}

		{#if musicMetadata.duration}
			<p class="text-sm text-gray-700">
				Durée : {Math.floor(musicMetadata.duration / 60)}:{(musicMetadata.duration % 60).toFixed(0).padStart(2, '0')}
			</p>
		{/if}

		{#if musicMetadata.timestamp}
			<p class="text-sm text-gray-700">Ajouté le : {new Date(musicMetadata.timestamp).toLocaleString()}</p>
		{/if}
	{/if}
</div>

