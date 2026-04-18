// ============================================================
//   server.js — Backend Express pour AutoBase
//
//   Ce fichier est le serveur Node.js qui tourne en permanence.
//   Il expose une API REST sur le port 3000 et lit/écrit dans
//   data/cars.json pour que les données persistent pour toujours.
//
//   Démarrage :
//     npm install    (une seule fois, installe Express)
//     npm run dev    (démarre le serveur avec rechargement auto)
//
//   Routes disponibles :
//     GET    /api/cars        → retourne toutes les voitures
//     POST   /api/cars        → ajoute une voiture
//     PUT    /api/cars/:id    → modifie une voiture
//     DELETE /api/cars/:id    → supprime une voiture
// ============================================================

const express = require('express'); // Framework web Node.js
const cors    = require('cors');    // Autorise le frontend à appeler ce serveur
const fs      = require('fs');      // Module Node.js pour lire/écrire des fichiers
const path    = require('path');    // Module Node.js pour construire des chemins de fichiers

const app  = express(); // Crée l'application Express
const PORT = 3000;      // Port d'écoute du serveur

// ============================================================
//   CHEMIN VERS LE FICHIER DE DONNÉES
//
//   path.join() construit un chemin compatible Windows/Mac/Linux.
//   __dirname = le dossier où se trouve server.js (= backend/)
//   On pointe vers backend/data/cars.json
// ============================================================

const DATA_FILE = path.join(__dirname, 'data', 'cars.json');


// ============================================================
//   MIDDLEWARES
//
//   Un middleware est une fonction qui s'exécute sur CHAQUE
//   requête avant d'arriver aux routes.
// ============================================================

// CORS (Cross-Origin Resource Sharing) :
// Par défaut, un navigateur bloque les requêtes fetch() vers un
// domaine différent de celui de la page (sécurité navigateur).
// Ex: ton frontend est sur localhost:5500, le backend sur localhost:3000
// → sans cors(), toutes les requêtes seraient bloquées.
app.use(cors({
    origin: '*', // Autorise tous les domaines (ok pour le dev local)
    // En production tu mettrais l'URL exacte de ton frontend :
    // origin: 'https://ton-site.github.io'
}));

// express.json() parse automatiquement le corps des requêtes POST/PUT
// en JSON et le rend disponible dans req.body
// Sans ce middleware, req.body serait undefined
app.use(express.json());


// ============================================================
//   HELPERS — lecture et écriture du fichier JSON
//
//   On relit le fichier à chaque requête pour avoir les données
//   les plus fraîches (pas de cache mémoire qui désynchronise).
// ============================================================

// Lit cars.json et retourne le tableau JavaScript
function readCars() {
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        // readFileSync = lecture synchrone (bloquante) — ok ici car fichier petit
        // utf-8 = encodage pour lire le texte correctement (accents, etc.)
        return JSON.parse(content);
    } catch (error) {
        // Si le fichier n'existe pas encore, on retourne un tableau vide
        console.error('Erreur lecture fichier :', error.message);
        return [];
    }
}

// Écrit le tableau dans cars.json (remplace tout le contenu)
function writeCars(cars) {
    // JSON.stringify(data, null, 2) = formatage lisible avec 2 espaces d'indentation
    // writeFileSync = écriture synchrone — garantit que le fichier est écrit
    // avant que la réponse HTTP soit envoyée au client
    fs.writeFileSync(DATA_FILE, JSON.stringify(cars, null, 2), 'utf-8');
}


// ============================================================
//   ROUTE GET /api/cars
//   Retourne toutes les voitures
//
//   Appelée par : getCars() dans api.js
//   Réponse     : tableau JSON de toutes les voitures
// ============================================================

app.get('/api/cars', (req, res) => {
    try {
        const cars = readCars();
        // res.json() sérialise le tableau en JSON et envoie la réponse
        // avec le header Content-Type: application/json automatiquement
        res.json(cars);
        console.log(`GET /api/cars → ${cars.length} voitures envoyées`);
    } catch (error) {
        // 500 = Internal Server Error
        res.status(500).json({ error: 'Erreur lors de la lecture des données' });
    }
});


// ============================================================
//   ROUTE POST /api/cars
//   Ajoute une nouvelle voiture et la sauvegarde dans le JSON
//
//   Appelée par : addCar() dans api.js
//   Corps       : objet voiture SANS id (le serveur génère l'id)
//   Réponse     : la voiture créée AVEC son id
// ============================================================

app.post('/api/cars', (req, res) => {
    try {
        const cars   = readCars();
        const carData = req.body; // Les données envoyées par le frontend

        // Génération d'un id unique : on prend le max des ids existants + 1
        // Plus fiable que Date.now() quand plusieurs utilisateurs ajoutent en même temps
        const maxId = cars.reduce((max, car) => Math.max(max, car.id || 0), 0);
        const newCar = { id: maxId + 1, ...carData };

        cars.push(newCar);
        writeCars(cars); // ← C'est ici que la donnée est sauvegardée POUR TOUJOURS

        // 201 Created = code HTTP standard pour une ressource créée avec succès
        res.status(201).json(newCar);
        console.log(`POST /api/cars → voiture créée : ${newCar.marque} ${newCar.modele} (id: ${newCar.id})`);

    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création de la voiture' });
    }
});


// ============================================================
//   ROUTE PUT /api/cars/:id
//   Modifie une voiture existante
//
//   Appelée par : updateCar() dans api.js
//   :id         = paramètre d'URL (ex: /api/cars/3 → req.params.id = "3")
//   Corps       : objet voiture avec les nouvelles valeurs
//   Réponse     : la voiture mise à jour
// ============================================================

app.put('/api/cars/:id', (req, res) => {
    try {
        const cars = readCars();
        // parseInt car req.params.id est une STRING ("3"), les ids sont des nombres
        const id   = parseInt(req.params.id);

        // Trouve l'index de la voiture à modifier
        const index = cars.findIndex(car => car.id === id);

        if (index === -1) {
            // 404 Not Found = la voiture demandée n'existe pas
            return res.status(404).json({ error: `Voiture id ${id} introuvable` });
        }

        // On conserve l'id original et on écrase le reste avec les nouvelles données
        const updatedCar = { id, ...req.body };
        cars[index] = updatedCar;

        writeCars(cars); // Sauvegarde permanente

        res.json(updatedCar);
        console.log(`PUT /api/cars/${id} → voiture modifiée : ${updatedCar.marque} ${updatedCar.modele}`);

    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la modification de la voiture' });
    }
});


// ============================================================
//   ROUTE DELETE /api/cars/:id
//   Supprime une voiture
//
//   Appelée par : deleteCar() dans api.js
//   Réponse     : message de confirmation
// ============================================================

app.delete('/api/cars/:id', (req, res) => {
    try {
        const cars    = readCars();
        const id      = parseInt(req.params.id);
        const initial = cars.length;

        // Filtre le tableau pour exclure la voiture à supprimer
        const filtered = cars.filter(car => car.id !== id);

        if (filtered.length === initial) {
            // Aucune voiture retirée = id inexistant
            return res.status(404).json({ error: `Voiture id ${id} introuvable` });
        }

        writeCars(filtered); // Sauvegarde permanente sans la voiture supprimée

        // 200 avec message de confirmation
        res.json({ message: `Voiture id ${id} supprimée avec succès` });
        console.log(`DELETE /api/cars/${id} → supprimée`);

    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression de la voiture' });
    }
});


// ============================================================
//   DÉMARRAGE DU SERVEUR
//
//   app.listen() démarre le serveur sur le port défini.
//   Le callback est appelé une fois que le serveur est prêt.
// ============================================================

app.listen(PORT, () => {
    console.log('');
    console.log('🚗 AutoBase Backend démarré !');
    console.log(`📡 API disponible sur : http://localhost:${PORT}/api/cars`);
    console.log(`📁 Données stockées dans : ${DATA_FILE}`);
    console.log('');
    console.log('Routes disponibles :');
    console.log(`  GET    http://localhost:${PORT}/api/cars`);
    console.log(`  POST   http://localhost:${PORT}/api/cars`);
    console.log(`  PUT    http://localhost:${PORT}/api/cars/:id`);
    console.log(`  DELETE http://localhost:${PORT}/api/cars/:id`);
    console.log('');
});