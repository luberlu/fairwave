// gun-server.js
import Gun from 'gun';
import express from 'express';

// Créez une instance d'Express
const app = express();
const port = 8765;

// Configurer Gun comme middleware pour Express
app.use(Gun.serve);

// Démarrer le serveur Express
const server = app.listen(port, () => {
  console.log(`Gun server démarré sur http://localhost:${port}/gun`);
});

// Initialiser Gun en utilisant le serveur Express
Gun({ web: server });
