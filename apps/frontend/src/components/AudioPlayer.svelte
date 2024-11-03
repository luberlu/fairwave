<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fetchMusic } from '../lib/fetchMusic';

	export let cid: string;
	export let encryptionKey: string;

	let audioElement: HTMLAudioElement | null = null;
	let statusMessage = '';
	let duration: number | null = null;
	let title: string | null = null;
	let isAudioReady = false; // Contrôle l'affichage des informations audio

	async function playAudio() {
		statusMessage = "Chargement de l'audio...";
		const result = await fetchMusic(cid, audioElement, encryptionKey);

		console.log('result => ', result);

		if (result.status) {
			// Mise à jour des informations audio en cas de succès
			statusMessage = result.statusMessage;
			duration = result.duration;
			title = result.title;
			isAudioReady = true; // Active l'affichage des informations audio
		} else {
			statusMessage = result.statusMessage || "Erreur lors du chargement de l'audio.";
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
	{#if isAudioReady}
		{#if title}
			<h3 class="mt-4 text-lg font-semibold">Titre : {title}</h3>
		{/if}

		{#if duration}
			<p class="mb-2 text-sm text-gray-700">
				Durée : {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
			</p>
		{/if}
	{/if}
</div>
