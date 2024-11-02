<script lang="ts">
    import { generateRandomKey } from '../lib/uploadMusic';
    import { Icon, LockClosed } from 'svelte-hero-icons';

    export let secretKey = '';
    let copyStatus = '';

    function handleGenerateKey() {
        secretKey = generateRandomKey();
        copyStatus = '';
    }

    async function handleCopyKey() {
        try {
            await navigator.clipboard.writeText(secretKey);
            copyStatus = 'Clé copiée dans le presse-papiers !';
        } catch (error) {
            copyStatus = 'Erreur lors de la copie de la clé.';
            console.error("Erreur lors de la copie dans le presse-papiers", error);
        }
    }
</script>

<div class="mb-6 border-t pt-4">
    <h3 class="text-lg font-semibold mb-2">Cryptage</h3>
    <button
        on:click={handleGenerateKey}
        class="bg-green-500 text-white p-2 rounded-md w-full mb-2 flex items-center justify-center space-x-2"
    >
        <!-- Icône de verrouillage avec taille ajustée -->
        <Icon src="{LockClosed}" class="h-5 w-5" />
        <span>Générer une clé de cryptage</span>
    </button>
    <div class="flex items-center justify-between">
        <p class="text-sm text-gray-700">Clé de cryptage : <span class="font-mono text-gray-900">{secretKey}</span></p>
        <button
            on:click={handleCopyKey}
            class="ml-2 bg-gray-300 text-gray-800 p-1 rounded-md text-sm font-semibold hover:bg-gray-400"
        >
            Copier
        </button>
    </div>
    <p class="text-xs text-green-600 mt-1">{copyStatus}</p>
</div>
