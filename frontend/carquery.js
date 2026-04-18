// ============================================================
//   carquery.js — Import de voitures réelles via Car Query API
//
//   Car Query API est une API gratuite et publique qui recense
//   des milliers de modèles avec leurs specs réelles.
//   Aucune clé API requise, aucune inscription.
//
//   Documentation : https://www.carqueryapi.com/documentation/
//
//   Fonctionnement :
//   1. Clic sur "🔍 Importer des modèles"
//   2. L'utilisateur tape une marque (ex: "Ferrari", "BMW")
//   3. On appelle Car Query via un proxy CORS (allorigins.win)
//   4. Les résultats s'affichent avec leurs specs
//   5. L'utilisateur coche les modèles voulus
//   6. Ils sont importés dans Supabase via addCar() (api.js)
//
//   Dépendances (doivent être chargées avant) :
//   - api.js     → addCar()
//   - cars.js    → cars[], saveCache(), renderCards(), showStatus()
// ============================================================


// ============================================================
//   CONFIGURATION
//
//   Car Query bloque les appels navigateur directs (CORS).
//   allorigins.win est un proxy gratuit qui fait la requête
//   côté serveur à notre place et ajoute les bons headers CORS.
// ============================================================

const CARQUERY_BASE = 'https://www.carqueryapi.com/api/0.3/';

// Liste de proxies CORS à essayer dans l'ordre.
// Si l'un échoue (bloqué par le réseau ou down), on essaie le suivant.
const CORS_PROXIES = [
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://thingproxy.freeboard.io/fetch/${url}`,
];

// État local de la modale d'import
let apiResults   = [];          // Résultats bruts de la dernière recherche
let selectedCars = new Set();   // IDs des modèles cochés par l'utilisateur


// ============================================================
//   OUVERTURE / FERMETURE DE LA MODALE
// ============================================================

function openImportAPI() {
    document.getElementById('import-api-overlay').classList.add('open');
    // Remplit le filtre des années au premier ouverture
    populateYearFilter();
}

function closeImportAPI() {
    document.getElementById('import-api-overlay').classList.remove('open');
    // Réinitialise tout l'état local de la modale
    selectedCars.clear();
    apiResults = [];
    const resultsEl = document.getElementById('api-results');
    if (resultsEl) resultsEl.innerHTML = `
        <div class="api-placeholder">
            <div style="font-size:40px;margin-bottom:12px">🔍</div>
            <div>Recherche une marque pour voir les modèles disponibles</div>
        </div>`;
    const searchEl = document.getElementById('api-search-input');
    if (searchEl) searchEl.value = '';
    const countEl = document.getElementById('api-results-count');
    if (countEl) countEl.textContent = '';
    updateImportButton();
}

function closeImportAPIOutside(event) {
    if (event.target === document.getElementById('import-api-overlay')) closeImportAPI();
}


// ============================================================
//   populateYearFilter()
//   Remplit le <select> des années de l'année actuelle à 1950
// ============================================================

function populateYearFilter() {
    const select = document.getElementById('api-year-filter');
    if (!select || select.options.length > 1) return; // Déjà rempli

    const currentYear = new Date().getFullYear();
    select.innerHTML = '<option value="">Toutes les années</option>';

    for (let year = currentYear; year >= 1950; year--) {
        const opt      = document.createElement('option');
        opt.value      = year;
        opt.textContent = year;
        select.appendChild(opt);
    }

    // Refiltre sans relancer la recherche quand l'année change
    select.onchange = filterByYear;
}


// ============================================================
//   searchCarQuery()
//   Appelle Car Query pour récupérer les modèles d'une marque
//
//   Car Query renvoie du JSONP : ?({ "Models": [...] })
//   On retire le wrapper pour obtenir du JSON valide.
// ============================================================

async function searchCarQuery() {
    const input   = document.getElementById('api-search-input').value.trim();
    const btn     = document.getElementById('api-search-btn');
    const results = document.getElementById('api-results');

    if (!input) {
        results.innerHTML = `<div class="api-placeholder" style="color:#fbbf24">⚠ Entre une marque à rechercher</div>`;
        return;
    }

    // ---- État chargement ----
    btn.textContent = '⏳';
    btn.disabled    = true;
    results.innerHTML = `<div class="api-placeholder">⏳ Recherche en cours…</div>`;
    selectedCars.clear();
    updateImportButton();

    try {
        // On encode l'URL Car Query pour la passer en paramètre au proxy
        // encodeURIComponent() transforme les / : ? & en codes %XX
        const carQueryUrl = `${CARQUERY_BASE}?cmd=getModels&make=${encodeURIComponent(input)}&callback=?`;

        // Essaie chaque proxy dans l'ordre jusqu'à en trouver un qui répond
        let text = null;
        let lastError = null;

        for (const buildProxyUrl of CORS_PROXIES) {
            try {
                const proxyUrl = buildProxyUrl(carQueryUrl);
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`Statut ${response.status}`);
                text = await response.text();
                break; // Un proxy a fonctionné, on sort de la boucle
            } catch (err) {
                lastError = err;
                console.warn('Proxy échoué, essai suivant…', err.message);
            }
        }

        // Si aucun proxy n'a fonctionné
        if (text === null) throw new Error(`Tous les proxies ont échoué : ${lastError?.message}`);

        // Retire le wrapper JSONP : ?({ ... }) → { ... }
        text = text.replace(/^\?\(/, '').replace(/\);?\s*$/, '');

        const data = JSON.parse(text);

        if (!data.Models || data.Models.length === 0) {
            results.innerHTML = `
                <div class="api-placeholder">
                    😕 Aucun modèle trouvé pour "<strong>${input}</strong>"<br>
                    <small style="margin-top:8px;display:block">
                        Essaie en anglais : "Mercedes-Benz", "Audi", "Toyota", "Porsche"…
                    </small>
                </div>`;
            return;
        }

        apiResults = data.Models;
        renderAPIResults(apiResults);

    } catch (error) {
        console.error('Erreur Car Query :', error);
        results.innerHTML = `
            <div class="api-placeholder" style="color:#ff6b6b">
                ❌ Erreur de connexion à Car Query<br>
                <small>${error.message}</small>
            </div>`;
    } finally {
        btn.textContent = 'Rechercher';
        btn.disabled    = false;
    }
}


// ============================================================
//   filterByYear() — Filtre les résultats sans relancer la recherche
// ============================================================

function filterByYear() {
    const year     = document.getElementById('api-year-filter').value;
    const filtered = year
        ? apiResults.filter(m => String(m.model_year) === year)
        : apiResults;
    renderAPIResults(filtered);
}


// ============================================================
//   renderAPIResults() — Génère le HTML de la liste des modèles
//
//   Les données de chaque modèle sont stockées dans data-model
//   (attribut HTML) pour être récupérées lors de l'import.
// ============================================================

function renderAPIResults(models) {
    const resultsEl = document.getElementById('api-results');
    const countEl   = document.getElementById('api-results-count');

    countEl.textContent = `${models.length} modèle${models.length > 1 ? 's' : ''} trouvé${models.length > 1 ? 's' : ''}`;

    if (models.length === 0) {
        resultsEl.innerHTML = `<div class="api-placeholder">Aucun modèle pour cette année</div>`;
        return;
    }

    resultsEl.innerHTML = models.map(model => {
        // ID unique pour identifier la ligne dans le DOM
        const id = `${model.model_make_id}_${model.model_name}_${model.model_year}`
            .replace(/[\s\/\\'"]/g, '_');

        const power     = model.model_engine_power_ps ? `${model.model_engine_power_ps} ch` : '—';
        const cc        = model.model_engine_cc        ? `${model.model_engine_cc} cc`       : '—';
        const year      = model.model_year             || '—';
        const isChecked = selectedCars.has(id);

        // Sérialise les données pour les récupérer à l'import
        // On double-encode pour éviter les conflits avec les attributs HTML
        const modelData = encodeURIComponent(JSON.stringify(model));

        return `
            <div class="api-result-item ${isChecked ? 'selected' : ''}" id="item-${id}">
                <label class="api-result-label">
                    <input type="checkbox" class="api-checkbox" value="${id}"
                        ${isChecked ? 'checked' : ''}
                        onchange="toggleCarSelection(this, '${id}')"
                        data-model="${modelData}">
                    <div class="api-result-info">
                        <div class="api-result-name">
                            ${capitalizeFirst(model.model_make_id)} ${model.model_name}
                            <span class="api-result-year">${year}</span>
                        </div>
                        <div class="api-result-specs">${power} · ${cc}</div>
                    </div>
                </label>
            </div>`;
    }).join('');
}


// ============================================================
//   toggleCarSelection() — Coche/décoche un modèle
// ============================================================

function toggleCarSelection(checkbox, id) {
    const item = document.getElementById(`item-${id}`);
    if (checkbox.checked) {
        selectedCars.add(id);
        if (item) item.classList.add('selected');
    } else {
        selectedCars.delete(id);
        if (item) item.classList.remove('selected');
    }
    updateImportButton();
}

function updateImportButton() {
    const btn   = document.getElementById('api-import-btn');
    const count = document.getElementById('selected-count');
    if (!btn || !count) return;
    const n       = selectedCars.size;
    count.textContent = n;
    btn.disabled      = n === 0;
    btn.style.opacity = n === 0 ? '0.4' : '1';
}


// ============================================================
//   importSelected() — Importe les modèles cochés dans Supabase
//
//   Flux pour chaque modèle coché :
//   1. Décode les données Car Query depuis data-model
//   2. Convertit au format FullThrottle
//   3. addCar() → Supabase (api.js)
//   4. Push dans cars[] en mémoire
//
//   Puis : saveCache() + renderCards() pour mettre à jour l'UI
// ============================================================

async function importSelected() {
    const btn = document.getElementById('api-import-btn');
    if (selectedCars.size === 0) return;

    btn.textContent = '⏳ Import…';
    btn.disabled    = true;

    const checkboxes = document.querySelectorAll('.api-checkbox:checked');
    let imported = 0;
    let errors   = 0;

    for (const checkbox of checkboxes) {
        try {
            // Décode les données Car Query stockées en data-model
            // decodeURIComponent inverse le encodeURIComponent fait dans renderAPIResults
            const model = JSON.parse(decodeURIComponent(checkbox.getAttribute('data-model')));

            // ---- Conversion Car Query → format FullThrottle ----
            const carData = {
                marque:         capitalizeFirst(model.model_make_id),
                modele:         model.model_name                         || '',
                annee:          parseInt(model.model_year)               || null,
                pays:           model.make_country                       || '',
                type:           convertBodyType(model.model_body)        || '',
                energy:         convertFuelType(model.model_engine_fuel) || 'Essence',
                // model_engine_power_ps = puissance en PS (≈ ch français)
                puissance:      parseInt(model.model_engine_power_ps)    || null,
                couple:         parseInt(model.model_engine_torque_nm)   || null,
                cylindree:      parseInt(model.model_engine_cc)          || null,
                cylindres:      parseInt(model.model_engine_cyl)         || null,
                acceleration:   parseFloat(model.model_0_to_100_kph)     || null,
                vmax:           parseInt(model.model_top_speed_kph)      || null,
                description:    '',
                description_fr: '',
                description_en: '',
                image:          '',
                sound:          '',
            };

            // Envoie à Supabase — addCar() retourne la voiture créée avec son id
            const created = await addCar(carData);

            // Ajoute au tableau en mémoire global (défini dans cars.js)
            if (typeof cars !== 'undefined') cars.push(created);
            imported++;

        } catch (error) {
            console.warn('Erreur import voiture :', error.message);
            errors++;
        }
    }

    // Mise à jour cache localStorage + re-rendu des cartes
    if (typeof saveCache   === 'function') saveCache();
    if (typeof renderCards === 'function') renderCards();

    const msg = errors > 0
        ? `✅ ${imported} importée(s), ❌ ${errors} erreur(s)`
        : `✅ ${imported} voiture(s) importée(s) dans FullThrottle !`;

    if (typeof showStatus === 'function') showStatus(msg, imported > 0 ? 'success' : 'error');

    closeImportAPI();
}


// ============================================================
//   HELPERS — Conversion des données Car Query
// ============================================================

// Capitalise les noms de marques avec gestion des cas spéciaux
function capitalizeFirst(str) {
    if (!str) return '';
    const special = {
        'bmw':        'BMW',
        'vw':         'Volkswagen',
        'mg':         'MG',
        'gmc':        'GMC',
        'uaz':        'UAZ',
        'byd':        'BYD',
        'kia':        'Kia',
        'bmw-alpina': 'BMW Alpina',
        'mercedes-benz': 'Mercedes-Benz',
        'alfa-romeo': 'Alfa Romeo',
        'land-rover': 'Land Rover',
        'rolls-royce': 'Rolls-Royce',
        'aston-martin': 'Aston Martin',
    };
    return special[str.toLowerCase()]
        || str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Convertit le type carrosserie Car Query → catégories FullThrottle (en français)
// Les valeurs françaises sont stockées en base — translateValue() gère l'affichage EN
function convertBodyType(body) {
    if (!body) return '';
    const map = {
        'sedan':       'Berline',
        'saloon':      'Berline',
        'coupe':       'Coupé',
        'convertible': 'Cabriolet',
        'cabriolet':   'Cabriolet',
        'roadster':    'Cabriolet',
        'suv':         'SUV',
        'crossover':   'SUV',
        'hatchback':   'Citadine',
        'city car':    'Citadine',
        'wagon':       'Break',
        'estate':      'Break',
        'touring':     'Break',
        'pickup':      'Pick-up',
        'truck':       'Pick-up',
    };
    return map[body.toLowerCase()] || '';
}

// Convertit le type carburant Car Query → motorisations FullThrottle (en français)
function convertFuelType(fuel) {
    if (!fuel) return 'Essence';
    const map = {
        'gasoline':        'Essence',
        'petrol':          'Essence',
        'diesel':          'Diesel',
        'electric':        'Électrique',
        'hybrid':          'Hybride',
        'plug-in hybrid':  'Hybride rechargeable',
    };
    return map[fuel.toLowerCase()] || 'Essence';
}