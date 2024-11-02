<script lang="ts">
    import { uploadMusic } from '../lib/uploadMusic';
    import FileInfo from '../components/FileInfo.svelte';
    import EncryptionKey from '../components/EncryptionKey.svelte';
    import { Icon, ArrowDownTray, ArrowPath } from 'svelte-hero-icons';

    let title = '';
    let file: File | null = null;
    let secretKey = ''; // Clé de cryptage
    let uploadStatus = '';
    let isUploading = false;

    async function handleUpload() {
        if (!title || !file || !secretKey) {
            uploadStatus = "Veuillez remplir tous les champs.";
            return;
        }

        isUploading = true; // Activer le chargement
        uploadStatus = ''; // Réinitialiser le statut

        const result = await uploadMusic(title, file, secretKey);
        uploadStatus = result.success ? `Téléchargement réussi ! CID : ${result.cid}` : 'Erreur lors du téléchargement';
        
        isUploading = false; // Désactiver le chargement après le téléchargement
    }
</script>

<div class="p-6 border rounded-lg shadow-md bg-white">
    <h2 class="text-xl font-bold mb-6 text-center text-blue-600">Télécharger un fichier audio</h2>

    <!-- Section Informations du fichier -->
    <FileInfo bind:title bind:file />

    <!-- Section Cryptage -->
    <EncryptionKey bind:secretKey />

    <!-- Section Bouton Télécharger et statut -->
    <div class="text-center">
        <button
            on:click={handleUpload}
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
