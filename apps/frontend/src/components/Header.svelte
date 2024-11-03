<!-- Header.svelte -->
<script lang="ts">
    import { address, status, isAuthenticated, authenticate, checkAuthentication } from '../lib/authStore';
    import UserInfos from './UserInfos.svelte';
    import { onMount } from 'svelte';
  
    let showStatus = false;
  
    // Vérifier l'authentification lors du chargement du composant
    onMount(() => {
      checkAuthentication();
    });
  
    // Déconnecter l'utilisateur
    function logout() {
      address.set('');
      isAuthenticated.set(false);
      localStorage.removeItem('userAddress');
      status.set("Déconnecté avec succès.");
      showStatusMessage();
    }
  
    // Afficher le message temporairement
    function showStatusMessage() {
      showStatus = true;
      setTimeout(() => {
        showStatus = false;
        status.set('');
      }, 3000); // Message disparaît après 3 secondes
    }
  </script>
  
  <header class="bg-blue-700 text-white p-4 shadow-md">
    <div class="container mx-auto flex justify-between items-center">
      <h1 class="text-2xl font-bold">Fairwave</h1>
      <div class="flex items-center space-x-4">
        <nav class="flex space-x-4">
          <a href="/" class="hover:underline">Accueil</a>
          <a href="/upload" class="hover:underline">Upload</a>
          <a href="/get" class="hover:underline">Play</a>
        </nav>
        {#if $isAuthenticated}
          <UserInfos {address} />
          <button on:click={logout} class="bg-red-500 text-white p-2 rounded-md">
            Déconnexion
          </button>
        {:else}
          <button on:click={authenticate} class="bg-blue-500 text-white p-2 rounded-md">
            Se connecter avec MetaMask
          </button>
        {/if}
      </div>
    </div>
    {#if showStatus && $status}
      <div class="mt-2 text-center text-white bg-blue-500 p-2 rounded-md">
        {$status}
      </div>
    {/if}
  </header>
  