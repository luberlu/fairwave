<script lang="ts">
    import { onDestroy } from 'svelte';
  
    let cid = '';
    let audioUrl: string | null = null; // URL pour le streaming
    let status = '';
    let audioElement: HTMLAudioElement | null = null; // Référence à l'élément audio
    let duration: number | null = null; // Durée de l'audio
    let title: string | null = null; // Titre de l'audio

    async function fetchMusic() {
        if (!cid) {
            status = "Veuillez entrer un CID.";
            return;
        }

        try {
            const response = await fetch(`/api/music/stream/${cid}`);

            if (!response.ok) throw new Error('Erreur lors de la récupération du fichier.');

            // Récupérer la durée et le titre des en-têtes
            duration = parseFloat(response.headers.get('X-Duration') || '0');
            title = response.headers.get('X-Title'); // Récupérer le titre
            audioUrl = `/api/music/stream/${cid}`;
            status = "Fichier récupéré avec succès !";
        } catch (error) {
            console.error('Erreur lors de la récupération du fichier:', error);
            status = "Erreur lors de la récupération du fichier.";
        }
    }

    // Nettoyage de l'URL blob (si utilisé)
    onDestroy(() => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
    });
</script>
  
<h1>Récupérer un morceau</h1>
<input type="text" placeholder="CID" bind:value={cid} />
<button on:click={fetchMusic}>Récupérer</button>
  
<p>{status}</p>

<!-- Affiche toujours le lecteur audio -->
<div>
    <h2>Lecteur Audio :</h2>
    {#if title}
        <h3>Titre : {title}</h3> <!-- Affiche le titre ici -->
    {/if}
    <audio bind:this={audioElement} controls src={audioUrl}>
        <track kind="captions" />
    </audio>
    <p>Streaming à partir de CID : {cid}</p>
    {#if duration}
        <p>Durée : {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</p>
    {/if}
</div>
