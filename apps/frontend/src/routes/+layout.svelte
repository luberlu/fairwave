<script>
	import '../app.css';
	import Header from '../components/Header.svelte';
	import AudioPlayer from '../components/player/AudioPlayer.svelte';

	if (typeof window !== 'undefined') {
		window.global = window;
	}
</script>
  
  <div class="page min-h-screen flex flex-col bg-gray-100 text-gray-900">
	<!-- Header -->
	<Header/>
  
	<!-- Contenu principal -->
	<main class="container mx-auto flex-1 p-6">
	  <div class="bg-white p-8 rounded-lg shadow-lg">
		<slot /> <!-- Emplacement pour les pages enfants -->
	  </div>
	</main>
  
	<AudioPlayer />
	<!-- Footer -->
	<footer class="bg-gray-800 text-white text-center p-4 mt-auto">
	  <div class="container mx-auto">
		<p>&copy; 2023 Fairwave. Tous droits réservés.</p>
	  </div>
	</footer>
  </div>
  
  <style>
	.page {
		background-color: #171717;
	}
  </style>