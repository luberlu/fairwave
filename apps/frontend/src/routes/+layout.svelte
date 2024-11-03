<script>
	import '../app.css';

	if (typeof window !== 'undefined') {
		window.global = window;
	}
</script>
  
  <div class="min-h-screen flex flex-col bg-gray-100 text-gray-900">
	<!-- Header -->
	<header class="bg-blue-700 text-white p-4 shadow-md">
	  <div class="container mx-auto flex justify-between items-center">
		<h1 class="text-2xl font-bold">Fairwave</h1>
		<nav class="space-x-4">
		  <a href="/" class="hover:underline">Accueil</a>
		  <a href="/upload" class="hover:underline">Upload</a>
		  <a href="/get" class="hover:underline">Play</a>
		</nav>
	  </div>
	</header>
  
	<!-- Contenu principal -->
	<main class="container mx-auto flex-1 p-6">
	  <div class="bg-white p-8 rounded-lg shadow-lg">
		<slot /> <!-- Emplacement pour les pages enfants -->
	  </div>
	</main>
  
	<!-- Footer -->
	<footer class="bg-gray-800 text-white text-center p-4 mt-auto">
	  <div class="container mx-auto">
		<p>&copy; 2023 Fairwave. Tous droits réservés.</p>
	  </div>
	</footer>
  </div>
  