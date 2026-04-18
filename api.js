// ============================================================
//   api.js — Couche réseau (Data Access Layer)
//
//   Ce fichier est la SEULE partie du code qui communique avec
//   le serveur. Toute la logique fetch() est ici, isolée du reste.
//
//   Avantage architecture : si l'URL du backend change (ex: déploiement
//   sur Railway), tu modifies UNIQUEMENT API_BASE_URL ici,
//   et tout le reste du code continue de fonctionner sans changement.
//
//   Ordre de chargement dans index.html :
//     <script src="api.js"></script>   ← en premier
//     <script src="cars.js"></script>  ← utilise les fonctions de api.js
// ============================================================


// ============================================================
//   CONFIGURATION — URL du backend
//
//   Développement local  → backend Express sur localhost:3000
//   Production (déployé) → remplace par l'URL publique de ton backend
//     ex: const API_BASE_URL = 'https://autobase-api.railway.app/api';
// ============================================================

const API_BASE_URL = 'http://localhost:3000/api';


// ============================================================
//   HELPER — apiRequest()
//
//   Fonction générique qui centralise la logique commune
//   à tous les appels réseau :
//     - Headers JSON automatiques sur chaque requête
//     - Vérification du statut HTTP (response.ok)
//     - Parsing JSON automatique de la réponse
//     - Lancement d'une erreur explicite si le serveur répond mal
//
//   Paramètres :
//     endpoint — chemin relatif, ex: '/cars' ou '/cars/3'
//     options  — objet fetch optionnel : { method, body, headers… }
//
//   Retourne : Promise<any> — les données JSON parsées
//   Lance    : Error si statut HTTP >= 400 ou si réseau coupé
// ============================================================

async function apiRequest(endpoint, options = {}) {
    // Construction de l'URL complète : base + chemin
    // ex: 'http://localhost:3000/api' + '/cars' → 'http://localhost:3000/api/cars'
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        // On fusionne les options passées en paramètre avec les headers par défaut
        // L'opérateur spread (...) copie toutes les propriétés de l'objet
        ...options,
        headers: {
            'Content-Type': 'application/json', // On envoie du JSON
            'Accept': 'application/json',        // On veut recevoir du JSON
            ...options.headers,                  // Les headers custom ont la priorité
        },
    });

    // response.ok = true uniquement si le statut HTTP est entre 200 et 299
    // Pour 404 (introuvable), 500 (erreur serveur), etc., on lance une erreur
    if (!response.ok) {
        // On essaie de lire le message d'erreur renvoyé par le serveur
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `Erreur ${response.status} : ${response.statusText}`);
    }

    // Certaines réponses (comme DELETE 200) renvoient quand même du JSON
    // On vérifie le Content-Type pour savoir si on doit parser
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }

    // Réponse sans corps JSON (ex: 204 No Content)
    return null;
}


// ============================================================
//   getCars() — Récupère toutes les voitures
//
//   Méthode HTTP : GET /api/cars
//   Réponse      : tableau JSON de toutes les voitures
//   Retourne     : Promise<Array>
// ============================================================

async function getCars() {
    // GET est la méthode par défaut de fetch(), pas besoin de la préciser
    return apiRequest('/cars');
}


// ============================================================
//   addCar() — Ajoute une nouvelle voiture
//
//   Méthode HTTP : POST /api/cars
//   Corps        : objet voiture SANS id (le serveur génère l'id)
//   Réponse      : la voiture créée AVEC son id (généré par le serveur)
//   Retourne     : Promise<Object>
//
//   Le serveur génère l'id → on est sûr qu'il est unique,
//   même si plusieurs utilisateurs ajoutent en même temps.
// ============================================================

async function addCar(carData) {
    return apiRequest('/cars', {
        method: 'POST',
        // JSON.stringify() convertit l'objet JS en texte JSON
        // pour l'envoyer dans le corps de la requête HTTP
        body: JSON.stringify(carData),
    });
}


// ============================================================
//   updateCar() — Modifie une voiture existante
//
//   Méthode HTTP : PUT /api/cars/:id
//   Corps        : objet voiture complet avec les nouvelles valeurs
//   Réponse      : la voiture mise à jour
//   Retourne     : Promise<Object>
//
//   PUT = remplace TOUTE la ressource (différent de PATCH
//   qui ne modifie que les champs envoyés)
// ============================================================

async function updateCar(id, carData) {
    return apiRequest(`/cars/${id}`, {
        method: 'PUT',
        body: JSON.stringify(carData),
    });
}


// ============================================================
//   deleteCar() — Supprime une voiture
//
//   Méthode HTTP : DELETE /api/cars/:id
//   Réponse      : message de confirmation
//   Retourne     : Promise<Object>
// ============================================================

async function deleteCar(id) {
    return apiRequest(`/cars/${id}`, {
        method: 'DELETE',
    });
}