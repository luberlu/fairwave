<script lang="ts">
    import { Icon, ArrowDownTray } from 'svelte-hero-icons';
    export let title = '';
    export let file: File | null = null;
    export let uploadStatus = '';

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const selectedFile = input.files[0];
            
            // Vérification du type de fichier
            if (selectedFile.type !== "audio/mpeg") {
                uploadStatus = "Veuillez sélectionner un fichier MP3.";
                file = null;
                title = '';
                return;
            }

            file = selectedFile;
            uploadStatus = ''; // Réinitialiser le statut en cas de succès
            title = selectedFile.name.replace(/\.[^/.]+$/, ""); // Enlever l'extension du titre
        }
    }
</script>

<div class="mb-6">
    <h3 class="text-lg font-semibold mb-2">Informations du fichier</h3>
    <input
        type="text"
        placeholder="Titre"
        bind:value={title}
        class="border p-2 rounded-md w-full mb-2"
    />

    <!-- Input File avec accept pour mp3 uniquement -->
    <div class="relative">
        <input
            type="file"
            accept="audio/mpeg"
            on:change={handleFileChange}
            class="hidden" 
            id="file-upload"
        />
        <label
            for="file-upload"
            class="cursor-pointer bg-blue-500 text-white p-3 rounded-lg w-full text-center font-semibold transition-all duration-300 ease-in-out hover:bg-blue-600 hover:shadow-lg flex items-center justify-center space-x-2"
        >
            <Icon src="{ArrowDownTray}" class="h-5 w-5 text-white" />
            <span>Sélectionner un fichier</span>
        </label>
        
        {#if file}
            <p class="mt-2 text-sm text-gray-700">Fichier sélectionné : <span class="font-semibold">{file.name}</span></p>
        {/if}
    </div>
</div>
