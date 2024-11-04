<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fetchMusic } from '../lib/music/actions/fetchMusic';
	import { Music } from '../lib/music/Music'; // Importer la classe Music

	export let cid: string;

	let audioElement: HTMLAudioElement | null = null;
	let statusMessage = '';
	let title: string | null = null;
	let isAudioReady = false; // Contrôle l'affichage des informations audio
	let music: Music | null = null; // Instance de Music

	async function playAudio() {
		statusMessage = "Chargement de l'audio...";
		music = await fetchMusic(cid, audioElement);

		if (music?.status.success) {
			// Mise à jour des informations audio en cas de succès
			statusMessage = music.status.message;
			title = music.title;
			isAudioReady = true; // Active l'affichage des informations audio
		} else {
			statusMessage = music?.status.message || "Erreur lors du chargement de l'audio.";
		}
	}

	onMount(() => {
		if (audioElement) {
			playAudio();
		}
	});

	onDestroy(() => {
		if (audioElement) {
			URL.revokeObjectURL(audioElement.src);
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
	{#if isAudioReady && music?.status.success}
		{#if title}
			<h3 class="mt-4 text-lg font-semibold">Titre : {title}</h3>
		{/if}

		{#if music.duration}
			<p class="mb-2 text-sm text-gray-700">
				Durée : {Math.floor(music.duration / 60)}:{(music.duration % 60).toFixed(0).padStart(2, '0')}
			</p>
		{/if}
	{/if}
</div>
