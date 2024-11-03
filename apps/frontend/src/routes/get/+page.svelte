<script lang="ts">
    import AudioPlayer from '../../components/AudioPlayer.svelte';

    let cid = ''; // CID pour récupérer l'audio
    let fetchStatus = '';
    let isAudioLoaded = false; // Variable pour contrôler l'affichage du lecteur

    async function handleFetch() {
        if (!cid) {
            fetchStatus = "Veuillez entrer un CID.";
            return;
        }

        fetchStatus = "Chargement de l'audio...";
        isAudioLoaded = false;

        // Simuler le chargement de l'audio avec un délai
        setTimeout(() => {
            fetchStatus = ''; // Réinitialise le statut de chargement
            isAudioLoaded = true; // Active l'affichage du lecteur après le chargement
        }, 1000);
    }
</script>

<div class="container mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
    <!-- Section de Description -->
    <div class="text-left p-4">
        <h1 class="text-3xl font-bold mb-6 text-blue-600">Lecture Audio</h1>
        
        <p class="text-gray-700 mb-4">
            Bienvenue sur la page de lecture audio. Ici, vous pouvez accéder à votre fichier audio MP3 précédemment uploadé en fournissant le CID (Content Identifier) et la clé de cryptage.
        </p>

        <p class="text-gray-700 mb-4">
            Cette clé est utilisée pour déchiffrer et jouer l'audio directement dans votre navigateur. Assurez-vous d'entrer les informations correctes pour accéder au fichier en toute sécurité.
        </p>

        <p class="text-sm text-gray-500 mt-4">
            Note : Si vous n'avez pas la clé de cryptage ou le CID, il ne sera pas possible de lire le fichier. Veillez à conserver ces informations en lieu sûr.
        </p>
    </div>

    <!-- Formulaire de récupération -->
    <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold mb-6 text-center text-blue-600">Charger un fichier audio</h2>

        <div class="mb-4">
            <input 
                type="text" 
                placeholder="CID" 
                bind:value={cid} 
                class="border p-3 rounded-md w-full mb-4" 
            />
            <button 
                on:click={handleFetch} 
                class="bg-blue-500 text-white p-3 rounded-md w-full font-semibold transition-all duration-300 ease-in-out hover:bg-blue-600 flex items-center justify-center"
            >
                {#if fetchStatus === "Chargement de l'audio..."}
                    <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Chargement...
                {:else}
                    Charger l'audio
                {/if}
            </button>
            <p class="mt-4 text-sm text-gray-600">{fetchStatus}</p>
        </div>

        <!-- Affichage conditionnel du lecteur audio -->
        {#if isAudioLoaded}
            <AudioPlayer {cid} />
        {:else if !fetchStatus}
            <p class="text-sm text-gray-500">Veuillez entrer un CID et une clé de cryptage pour démarrer la lecture.</p>
        {/if}
    </div>
</div>
