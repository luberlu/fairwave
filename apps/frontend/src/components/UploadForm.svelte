<script lang="ts">
    import { uploadMusic } from '../lib/music/actions/uploadMusic';
    import FileInfo from '../components/FileInfo.svelte';
    import { Icon, ArrowPath } from 'svelte-hero-icons';

    let title = '';
    let file: File | null = null;
    let uploadStatus = '';
    let isUploading = false;

    async function handleUpload() {
        if (!title || !file) {
            uploadStatus = "Veuillez remplir tous les champs.";
            return;
        }

        isUploading = true; // Activer le chargement
        uploadStatus = ''; // Réinitialiser le statut

        const result = await uploadMusic(title, file);
        uploadStatus = result.success ? `Téléchargement réussi ! CID : ${result.cid}` : 'Erreur lors du téléchargement';
        
        isUploading = false; // Désactiver le chargement après le téléchargement
    }
</script>

<div class="p-6 border rounded-lg shadow-md bg-white">
    <h2 class="text-xl font-bold mb-6 text-center text-blue-600">Télécharger un fichier audio</h2>

    <!-- Section Informations du fichier -->
    <FileInfo bind:title bind:file />

    <!-- Section Bouton Télécharger et statut -->
    <div class="text-center">
        <button
            onclick={handleUpload}
            class="bg-blue-500 text-white p-2 rounded-md w-full flex items-center justify-center space-x-2"
            disabled={isUploading}
        >
            {#if isUploading}
                <Icon src="{ArrowPath}" class="h-5 w-5 text-white mr-2" />
                Téléchargement...
            {:else}
                <span>Télécharger</span>
            {/if}
        </button>
        <p class="mt-4 text-sm text-gray-600">{uploadStatus}</p>
    </div>
</div>
