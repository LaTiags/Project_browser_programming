// ============================================================
//   auth.js — Gestion de l'authentification Supabase
//
//   Ce fichier doit être chargé sur TOUTES les pages du site
//   AVANT les autres scripts (cars.js, f1.js, etc.)
//
//   Il gère :
//   - La vérification de session au chargement de chaque page
//   - L'affichage/masquage des boutons admin selon la session
//   - La déconnexion
//
//   Supabase Auth utilise des JWT stockés dans localStorage.
//   La session persiste entre les visites jusqu'à déconnexion.
//
//   Chargement dans chaque page :
//     <script src="auth.js"></script>  ← avant tous les autres scripts
// ============================================================


// ============================================================
//   CONFIGURATION SUPABASE
//   Mêmes valeurs que dans api.js
// ============================================================

const AUTH_SUPABASE_URL      = 'https://gathpbjhirtksasfmicn.supabase.co';
const AUTH_SUPABASE_ANON_KEY = 'sb_publishable_DCM5-BubeSaz0ipRero-7Q_9KXu2WU7';
const AUTH_API               = `${AUTH_SUPABASE_URL}/auth/v1`;

// Email de l'admin unique — seul cet email peut se connecter
// Change cette valeur par ton vrai email
const ADMIN_EMAIL = 'cristianolecrack@gmail.com';


// ============================================================
//   ÉTAT DE SESSION
//   Accessible depuis tous les autres scripts via isAdmin()
// ============================================================

let _session = null; // Stocke le token JWT actuel


// ============================================================
//   getSession() — Récupère la session stockée dans localStorage
//
//   Supabase stocke automatiquement la session dans localStorage
//   sous la clé "sb-[project-ref]-auth-token".
//   On la lit au démarrage pour savoir si l'utilisateur est connecté.
// ============================================================

function getSession() {
    try {
        // Cherche la clé Supabase dans localStorage
        // Le format est : sb-XXXX-auth-token
        const keys = Object.keys(localStorage).filter(k =>
            k.startsWith('sb-') && k.endsWith('-auth-token')
        );
        if (keys.length === 0) return null;

        const raw = localStorage.getItem(keys[0]);
        if (!raw) return null;

        const session = JSON.parse(raw);

        // Vérifie que le token n'est pas expiré
        // expires_at est un timestamp UNIX en secondes
        if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
            return null; // Session expirée
        }

        return session;
    } catch {
        return null;
    }
}


// ============================================================
//   isAdmin() — Vérifie si l'utilisateur connecté est l'admin
//
//   Retourne true uniquement si :
//   1. Une session valide existe
//   2. L'email correspond à ADMIN_EMAIL
//
//   Utilisé dans cars.js pour afficher/cacher les boutons
// ============================================================

function isAdmin() {
    const session = getSession();
    if (!session) return false;
    const email = session.user?.email || '';
    return email === ADMIN_EMAIL;
}


// ============================================================
//   applyAuthUI() — Met à jour l'interface selon la session
//
//   Appelée au chargement de chaque page.
//   - Admin connecté   → boutons admin visibles, bouton Logout
//   - Non connecté     → boutons admin cachés, bouton Login
// ============================================================

function applyAuthUI() {
    const admin = isAdmin();

    // Éléments à afficher uniquement pour l'admin
    // On utilise la classe CSS "admin-only" sur ces éléments
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = admin ? '' : 'none';
    });

    // Bouton logout dans le header (ajouté dynamiquement)
    const existing = document.getElementById('auth-btn');
    if (existing) existing.remove();

    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const btn = document.createElement('button');
    btn.id = 'auth-btn';
    btn.className = 'btn-secondary';

    if (admin) {
        // Admin connecté : affiche son email + bouton logout
        btn.textContent = '🔓 Logout';
        btn.onclick = logout;
        btn.style.borderColor = 'rgba(74, 222, 128, 0.4)';
        btn.style.color       = '#4ade80';
    } else {
        // Non connecté : bouton login
        btn.textContent = '🔐 Login';
        btn.onclick = () => window.location.href = 'login.html';
    }

    // Insère le bouton en premier dans les actions du header
    headerActions.insertBefore(btn, headerActions.firstChild);
}


// ============================================================
//   logout() — Déconnecte l'utilisateur
//
//   Supprime la session Supabase du localStorage
//   et redirige vers la page de login.
// ============================================================

async function logout() {
    try {
        const session = getSession();
        if (session?.access_token) {
            // Appelle l'endpoint logout de Supabase pour invalider le token
            await fetch(`${AUTH_API}/logout`, {
                method: 'POST',
                headers: {
                    'apikey':        AUTH_SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type':  'application/json',
                },
            });
        }
    } catch (e) {
        console.warn('Erreur logout API :', e);
    }

    // Supprime toutes les clés de session Supabase du localStorage
    Object.keys(localStorage)
        .filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
        .forEach(k => localStorage.removeItem(k));

    _session = null;

    // Redirige vers login
    window.location.href = 'login.html';
}


// ============================================================
//   INITIALISATION
//   Appelée automatiquement au chargement du DOM
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    _session = getSession();
    applyAuthUI();
});