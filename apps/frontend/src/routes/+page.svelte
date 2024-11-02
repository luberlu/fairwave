<script lang="ts">
    import { onMount } from 'svelte';
</script>

<div class="container mx-auto px-8 py-12">
    <h1 class="text-5xl font-bold mb-10 text-blue-700">Stockage audio décentralisé et sécurisé</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
            <h2 class="text-2xl font-semibold mb-4 text-blue-600">Comment ça fonctionne ?</h2>
            <p class="text-gray-700 mb-4">
                Ce projet utilise IPFS (InterPlanetary File System) et un chiffrement par clé pour sécuriser vos fichiers audio. Chaque fichier est divisé en fragments chiffrés, stockés sur IPFS, accessible seulement à ceux ayant la clé de déchiffrement.
            </p>
            <ul class="list-disc ml-5 space-y-2 text-gray-600">
                <li>Les fichiers sont fragmentés en plusieurs parties (chunks).</li>
                <li>Chaque chunk est chiffré avec une clé unique.</li>
                <li>Les fragments chiffrés sont stockés sur IPFS, offrant un stockage décentralisé.</li>
                <li>Chaque fragment est accessible via un identifiant unique (CID) généré par IPFS.</li>
            </ul>
        </div>

        <div>
            <h2 class="text-2xl font-semibold mb-4 text-blue-600">Pourquoi IPFS et le chiffrement ?</h2>
            <p class="text-gray-700 mb-4">
                IPFS fournit un réseau de stockage décentralisé et distribué, permettant une accessibilité renforcée. Grâce au chiffrement, vos données restent sécurisées : seul l’utilisateur ayant la clé de déchiffrement peut reconstituer le fichier original.
            </p>
        </div>
    </div>

    <div class="bg-white p-8 mt-10 rounded-lg shadow-md">
        <h3 class="text-2xl font-semibold text-blue-600 mb-4">Fonctionnalités principales</h3>
        <ul class="list-disc ml-5 space-y-2 text-gray-600">
            <li>Téléchargement de fichiers audio MP3 avec clé de chiffrement unique.</li>
            <li>Stockage sur IPFS pour une meilleure durabilité des données.</li>
            <li>Lecture sécurisée en ligne, nécessitant la clé pour accéder au fichier.</li>
        </ul>
    </div>

    <div class="mt-10 text-gray-600">
        <p>
            Explorez les sections de téléchargement et de lecture pour expérimenter le processus de chiffrement et de lecture sécurisé. Pour plus de détails, consultez la documentation de <a href="https://svelte.dev/docs/kit" class="text-blue-500 hover:underline">SvelteKit</a> et <a href="https://docs.ipfs.io/" class="text-blue-500 hover:underline">IPFS</a>.
        </p>
    </div>
</div>
