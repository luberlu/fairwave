<script lang="ts">
    import { onDestroy } from 'svelte';

    let cid = '';
    let audioElement: HTMLAudioElement | null = null;
    let status = '';
    let duration: number | null = null;
    let title: string | null = null;
    let encryptionKey = ''; // Clé de cryptage
    let sourceBuffer: SourceBuffer | null = null; // Référence au SourceBuffer
    let mediaSource: MediaSource | null = null; // Référence au MediaSource
    let isAppending = false; // Indicateur pour savoir si nous sommes en train d'ajouter des données

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

            duration = parseFloat(response.headers.get('X-Duration') || '0');
            title = response.headers.get('X-Title'); // Récupérer le titre

            mediaSource = new MediaSource();
            audioElement.src = URL.createObjectURL(mediaSource);

            mediaSource.addEventListener('sourceopen', async () => {
                sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');

                const reader = response.body.getReader();

                // Lire les données audio à partir de la réponse en streaming
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    // Attendre si nous sommes déjà en train d'ajouter des données
                    while (isAppending) {
                        await new Promise(resolve => setTimeout(resolve, 100)); // Attendre un peu avant de réessayer
                    }

                    isAppending = true; // Indiquer que nous commençons l'opération d'ajout
                    sourceBuffer.appendBuffer(value);
                    sourceBuffer.addEventListener('updateend', () => {
                        isAppending = false; // Réinitialiser l'indicateur après l'ajout
                    });
                }
            });

            status = "Fichier récupéré avec succès !";
        } catch (error) {
            console.error('Erreur lors de la récupération du fichier:', error);
            status = `Erreur lors de la récupération du fichier : ${error.message}`;
        }
    }

    // Nettoyage de l'URL blob (si utilisé)
    onDestroy(() => {
        if (audioElement) {
            URL.revokeObjectURL(audioElement.src);
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
        <h3>Titre : {title}</h3>
    {/if}
    <audio bind:this={audioElement} controls>
        <track kind="captions" />
    </audio>
    <p>Streaming à partir de CID : {cid}</p>
    {#if duration}
        <p>Durée : {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</p>
    {/if}
</div>
