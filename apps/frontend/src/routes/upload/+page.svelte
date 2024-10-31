<script lang="ts">
    let title = '';
    let file: File | null = null;
    let uploadStatus = '';
  
    const handleFileChange = (event: any) => {
        const selectedFile = event.target.files[0];

        if (selectedFile) {
            file = selectedFile;
            console.log('Selected file:', file);
        } else {
            file = null;
        }
    };
  
    async function uploadMusic() {
      if (!file || !title) {
        uploadStatus = "Veuillez remplir tous les champs.";
        return;
      }
  
      try {
        const formData = new FormData();
        const blob = new Blob([file]); // Crée un Blob si nécessaire

        formData.append('title', title);
        formData.append('file', blob, file.name); // Ajoute le fichier avec son nom

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
  <button on:click={uploadMusic}>Télécharger</button>
  
  <p>{uploadStatus}</p>
  