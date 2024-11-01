<script lang="ts">
    let title = '';
    let file: File | null = null;
    let uploadStatus = '';
    let secretKey = ''; // Variable pour stocker la clé secrète
    let generateKeyStatus = ''; // Statut pour la génération de la clé

    const handleFileChange = (event: any) => {
        const selectedFile = event.target.files[0];

        if (selectedFile) {
            file = selectedFile;
            console.log('Selected file:', file);
        } else {
            file = null;
        }
    };
  
    // Fonction pour générer une clé aléatoire
    function generateRandomKey() {
        // Générer une clé aléatoire (ici un simple exemple avec Math.random)
        secretKey = Math.random().toString(36).substring(2, 18); // Clé aléatoire de 16 caractères
        generateKeyStatus = 'Clé générée : ' + secretKey;
    }
  
    async function uploadMusic() {
      if (!file || !title || !secretKey) {
        uploadStatus = "Veuillez remplir tous les champs.";
        return;
      }
  
      try {
        const formData = new FormData();
        const blob = new Blob([file]); // Crée un Blob si nécessaire

        formData.append('title', title);
        formData.append('file', blob, file.name); // Ajoute le fichier avec son nom
        formData.append('secretKey', secretKey); // Ajoute la clé secrète

        const response = await fetch('/api/music/upload', {
          method: 'POST',
          body: formData
        });
  
        const result = await response.json();
        uploadStatus = `Téléchargé avec succès ! CID : ${result.ipfsHash}`;
      } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        uploadStatus = "Erreur lors du téléchargement du fichier.";
      }
    }
</script>
  
<h1>Télécharger un morceau</h1>
<input type="text" placeholder="Titre" bind:value={title} />
<input type="file" on:change={handleFileChange} />
<button on:click={generateRandomKey}>Générer une clé aléatoire</button>
<p>{generateKeyStatus}</p>
<input type="text" placeholder="Clé de cryptage" bind:value={secretKey} />
<button on:click={uploadMusic}>Télécharger</button>

<p>{uploadStatus}</p>
