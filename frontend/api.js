// ============================================================
//   api.js — Couche réseau avec Supabase
//
//   Supabase génère automatiquement une API REST sur chaque
//   table de ta base PostgreSQL. Pas besoin d'un backend Express
//   ou de fonctions serverless — on appelle directement l'API
//   Supabase depuis le navigateur.
//
//   URL de base : https://TON_ID.supabase.co/rest/v1/cars
//
//   Authentification : la clé "anon" (anonyme) est publique
//   et sécurisée par les politiques RLS définies dans schema.sql.
//
//   Documentation Supabase REST :
//   https://supabase.com/docs/guides/api
// ============================================================


// ============================================================
//   CONFIGURATION — À remplir avec tes vraies valeurs Supabase
//
//   Supabase Dashboard → Settings → API
//     SUPABASE_URL     = "Project URL"
//     SUPABASE_ANON_KEY = "anon public" key
//
//   La clé "anon" est PUBLIQUE — elle est faite pour être
//   exposée dans le frontend. La sécurité est gérée par RLS.
// ============================================================

const SUPABASE_URL = 'https://gathpbjhirtksasfmicn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DCM5-BubeSaz0ipRero-7Q_9KXu2WU7';

// URL complète vers la table "cars"
const CARS_URL = `${SUPABASE_URL}/rest/v1/cars`;


// ============================================================
//   HEADERS communs à toutes les requêtes Supabase
//
//   apikey      : identifie ton projet Supabase
//   Authorization : authentifie la requête (Bearer token)
//   Content-Type  : on envoie du JSON
//   Prefer        : "return=representation" → Supabase retourne
//                   l'objet créé/modifié dans la réponse
//                   (sinon il retourne juste 201 sans corps)
// ============================================================

function getHeaders(extra = {}) {
    return {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
        ...extra,
    };
}


// ============================================================
//   getCars() — Récupère toutes les voitures
//
//   Supabase REST : GET /rest/v1/cars?select=*
//   "?select=*" = retourne toutes les colonnes
//   "?order=id" = triées par id croissant
//
//   Retourne : Promise<Array>
// ============================================================

async function getCars() {
    const response = await fetch(`${CARS_URL}?select=*&order=id`, {
        method: 'GET',
        headers: getHeaders(),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Erreur ${response.status}`);
    }

    return response.json(); // Tableau de toutes les voitures
}


// ============================================================
//   addCar() — Ajoute une nouvelle voiture
//
//   Supabase REST : POST /rest/v1/cars
//   Corps         : objet voiture SANS id (PostgreSQL "serial"
//                   génère l'id automatiquement)
//   Réponse       : tableau avec la voiture créée + son id
//
//   Retourne : Promise<Object> — la voiture créée avec son id
// ============================================================

async function addCar(carData) {
    // On retire l'id si présent — Supabase le génère tout seul (serial)
    const { id, ...dataWithoutId } = carData;

    const response = await fetch(CARS_URL, {
        method:  'POST',
        headers: getHeaders(),
        body:    JSON.stringify(dataWithoutId),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Erreur ${response.status}`);
    }

    // Supabase retourne un tableau même pour un seul insert
    // On prend le premier (et unique) élément
    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
}


// ============================================================
//   updateCar() — Modifie une voiture existante
//
//   Supabase REST : PATCH /rest/v1/cars?id=eq.3
//   "?id=eq.3"    = filtre WHERE id = 3 (syntaxe Supabase)
//   Corps         : champs à mettre à jour
//
//   Retourne : Promise<Object> — la voiture mise à jour
// ============================================================

async function updateCar(id, carData) {
    // On retire l'id du corps — il est dans l'URL, pas dans le body
    const { id: _, ...dataWithoutId } = carData;

    const response = await fetch(`${CARS_URL}?id=eq.${id}`, {
        method:  'PATCH',    // PATCH = mise à jour partielle (différent de PUT)
        headers: getHeaders(),
        body:    JSON.stringify(dataWithoutId),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Erreur ${response.status}`);
    }

    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
}


// ============================================================
//   deleteCar() — Supprime une voiture
//
//   Supabase REST : DELETE /rest/v1/cars?id=eq.3
//   "?id=eq.3"    = filtre WHERE id = 3
//
//   Retourne : Promise<null>
// ============================================================

async function deleteCar(id) {
    const response = await fetch(`${CARS_URL}?id=eq.${id}`, {
        method:  'DELETE',
        headers: getHeaders(),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Erreur ${response.status}`);
    }

    return null;
}