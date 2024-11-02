<script lang="ts">
  import UploadForm from '../../components/UploadForm.svelte';
</script>

<div class="container mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
  <!-- Section de Description -->
  <div class="text-left p-4">
    <h1 class="text-3xl font-bold mb-6 text-blue-600">Upload</h1>
    
    <p class="text-gray-700 mb-4">
      Bienvenue sur la page de téléchargement de fichiers audio. Ici, vous pouvez uploader vos morceaux MP3 et les sécuriser grâce à un chiffrement par clé.
      Une fois le fichier uploadé, il est divisé en plusieurs chunks (fragments) qui sont chacun cryptés et stockés de manière décentralisée sur IPFS.
    </p>

    <p class="text-gray-700 mb-4">
      Chaque fragment est associé à un identifiant unique, appelé CID (Content Identifier), vous permettant de retrouver et de lire votre audio en toute sécurité. 
      Pour accéder à votre fichier, vous aurez besoin de la clé de cryptage générée lors du téléchargement.
    </p>

    <p class="text-sm text-gray-500 mt-4">
      Note : N'oubliez pas de sauvegarder votre clé de cryptage. Elle est indispensable pour déchiffrer et lire votre fichier.
    </p>
  </div>

  <!-- Formulaire de téléchargement -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <UploadForm />
  </div>
</div>
