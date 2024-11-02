<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { fetchMusic } from '../lib/fetchMusic';

    export let cid: string;
    export let encryptionKey: string;

    let audioElement: HTMLAudioElement | null = null;
    let status = '';
    let duration: number | null = null;
    let title: string | null = null;
    let isAudioReady = false; // Contrôle l'affichage des informations audio

    async function playAudio() {
        status = "Chargement de l'audio...";
        const result = await fetchMusic(cid, encryptionKey, audioElement);

        console.log('result => ', result);

        if (result.mediaSource) {
            ({ status, duration, title } = result); // Mise à jour des informations audio
            isAudioReady = true; // Active l'affichage des informations audio
            status = ''; // Réinitialise le statut
        } else {
            status = result.status || "Erreur lors du chargement de l'audio.";
        }
    }

    onMount(() => {
        if(audioElement){
            playAudio();
        }
    });

    onDestroy(() => {
        if (audioElement) {
            URL.revokeObjectURL(audioElement.src);
        }
    });
</script>

<div class="p-4 bg-white rounded-lg shadow-md">
    <!-- Statut de chargement ou erreur -->
    <p class="text-sm text-gray-600 mb-4">{status}</p>

    <!-- Toujours monter le lecteur audio, mais activer les contrôles lorsque prêt -->
    <audio bind:this={audioElement} controls={isAudioReady} class="w-full">
        <track kind="captions" />
    </audio>

    <!-- Informations audio uniquement lorsque prêt -->
    {#if isAudioReady}
        {#if title}
            <h3 class="text-lg font-semibold mt-4">Titre : {title}</h3>
        {/if}

        {#if duration}
            <p class="text-sm text-gray-700 mb-2">
                Durée : {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
            </p>
        {/if}
    {/if}
</div>
