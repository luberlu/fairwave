<script lang="ts">
    import { onDestroy } from 'svelte';

    let cid = '';
    let audioUrl: string | null = null; // URL pour le streaming
    let status = '';
    let audioElement: HTMLAudioElement | null = null; // Référence à l'élément audio
    let duration: number | null = null; // Durée de l'audio
    let title: string | null = null; // Titre de l'audio
    let encryptionKey = ''; // Clé de cryptage

    async function fetchMusic() {
        if (!cid || !encryptionKey) {
            status = "Veuillez entrer un CID et une clé de cryptage.";
            return;
        }

        try {
            const response = await fetch(`/api/music/stream/${cid}`, {
                method: 'GET',
                headers: {
                    'X-Encryption-Key': encryptionKey // Inclure la clé dans l'en-tête
                }
            });

            if (!response.ok) throw new Error(await response.text()); // Récupérer le message d'erreur

            // Récupérer la durée et le titre des en-têtes
            duration = parseFloat(response.headers.get('X-Duration') || '0');
            title = response.headers.get('X-Title'); // Récupérer le titre
            audioUrl = `/api/music/stream/${cid}`;
            status = "Fichier récupéré avec succès !";
        } catch (error) {
            console.error('Erreur lors de la récupération du fichier:', error);
            status = `Erreur lors de la récupération du fichier : ${error.message}`;
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
<input type="text" placeholder="Clé de cryptage" bind:value={encryptionKey} />
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
