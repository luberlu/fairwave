<script lang="ts">
  import { ethers } from 'ethers';
  import Gun from 'gun';

  let gun;
  let address = '';
  let status = '';
  let isAuthenticated = false;

  // Initialiser Gun côté client et se connecter au nœud Gun du backend
  gun = Gun(['http://localhost:8765/gun']); // Remplacez l’URL par celle de votre nœud Gun

  async function authenticate() {
    if (!(window as any).ethereum) {
      status = "Veuillez installer MetaMask pour continuer.";
      return;
    }

    try {
      // Initialiser le provider Ethers et obtenir l'adresse de l'utilisateur
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      address = await signer.getAddress();

      // Génère un message à signer
      const message = "Veuillez signer ce message pour authentifier votre session.";
      const signature = await signer.signMessage(message);

      // Stocker ou mettre à jour le profil utilisateur dans Gun
      gun.get('userProfiles').get(address).put({ address, signature });

      isAuthenticated = true;
      status = "Profil utilisateur authentifié et stocké avec succès !";
    } catch (error) {
      console.error("Erreur lors de l'authentification :", error);
      status = "Erreur lors de l'authentification et de la création du profil.";
    }
  }

  // Fonction pour vérifier l'authentification en consultant Gun
  async function checkAuthentication() {
    gun.get('userProfiles').get(address).once(data => {
      if (data && data.signature) {
        isAuthenticated = true;
        status = "Authentification vérifiée depuis Gun !";
      } else {
        status = "Profil non trouvé dans Gun.";
      }
    });
  }
</script>

<div class="p-6">
  <h2 class="text-xl font-bold">Authentification de l'artiste</h2>
  {#if isAuthenticated}
    <p>Connecté en tant que : {address}</p>
    <p>{status}</p>
  {:else}
    <button on:click={authenticate} class="bg-blue-500 text-white p-2 rounded-md">
      Se connecter avec MetaMask et créer un profil
    </button>
    <p>{status}</p>
  {/if}
</div>
