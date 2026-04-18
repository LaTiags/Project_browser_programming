// ============================================================
//   cars.js — Logique principale (version améliorée)
// ============================================================


// ============================================================
//   CONSTANTES
// ============================================================

const EMOJIS = {
    'Supercar':   '🏎️', 'Hypercar':   '🏎️',
    'SUV':        '🚙',
    'Berline':    '🚗', 'Sedan':      '🚗',
    'Coupé':      '🚗', 'Coupe':      '🚗',
    'Cabriolet':  '🚗', 'Convertible':'🚗',
    'Citadine':   '🚕', 'City car':   '🚕',
    'Break':      '🚐', 'Estate':     '🚐',
    'Pick-up':    '🛻',
};

const ENERGY_COLORS = {
    'Électrique': '#4ade80', 'Electric': '#4ade80',
    'Hybride': '#60a5fa', 'Hybrid': '#60a5fa',
    'Hybride rechargeable': '#34d399', 'Plug-in hybrid': '#34d399',
    'Essence': '#fbbf24', 'Petrol': '#fbbf24',
    'Diesel': '#94a3b8',
};

// Puissance max référence pour les barres de performance
const MAX_REF = {
    puissance: 1500,
    couple: 1600,
    vmax: 400,
    acceleration: 10,
};


// ============================================================
//   TRADUCTION DES VALEURS (catégories, motorisations, pays)
// ============================================================

function translateValue(value) {
    if (!value) return value;
    const map = {
        // Catégories
        'Berline':   { en: 'Sedan' },
        'SUV':       { en: 'SUV' },
        'Coupé':     { en: 'Coupe' },
        'Cabriolet': { en: 'Convertible' },
        'Supercar':  { en: 'Supercar' },
        'Hypercar':  { en: 'Hypercar' },
        'Citadine':  { en: 'City car' },
        'Break':     { en: 'Estate' },
        'Pick-up':   { en: 'Pick-up' },
        // Motorisations
        'Essence':              { en: 'Petrol' },
        'Diesel':               { en: 'Diesel' },
        'Électrique':           { en: 'Electric' },
        'Hybride':              { en: 'Hybrid' },
        'Hybride rechargeable': { en: 'Plug-in hybrid' },
        // Pays
        'Italie':       { en: 'Italy' },
        'Allemagne':    { en: 'Germany' },
        'France':       { en: 'France' },
        'États-Unis':   { en: 'USA' },
        'Japon':        { en: 'Japan' },
        'Royaume-Uni':  { en: 'UK' },
        'Suède':        { en: 'Sweden' },
        'Espagne':      { en: 'Spain' },
        'Autriche':     { en: 'Austria' },
        'Suisse':       { en: 'Switzerland' },
        'Angleterre':   { en: 'England' },
        'Tchéquie':     { en: 'Czech Republic' },
        'Roumanie':     { en: 'Romania' },
        'Corée du Sud': { en: 'South Korea' },
    };
    if (currentLang === 'en' && map[value]) return map[value].en;
    return value;
}


// ============================================================
//   ÉTAT GLOBAL
// ============================================================

let cars = [];
let currentView = localStorage.getItem('autobase_view') || 'grid';
let compareIds = [];
let favIds = new Set(JSON.parse(localStorage.getItem('autobase_favs') || '[]'));
let showFavsOnly = false;


// ============================================================
//   CACHE localStorage
// ============================================================

const CACHE_KEY = 'autobase_cars_cache';

function saveCache() {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cars));
}

function loadCache() {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
}

function saveFavs() {
    localStorage.setItem('autobase_favs', JSON.stringify([...favIds]));
}


// ============================================================
//   AFFICHAGE DU STATUT RÉSEAU
// ============================================================

function showStatus(message, type = 'info') {
    const colors = {
        info:    'rgba(96, 165, 250, 0.15)',
        success: 'rgba(74, 222, 128, 0.15)',
        error:   'rgba(255, 107, 107, 0.15)',
    };
    const borders = {
        info:    'rgba(96, 165, 250, 0.4)',
        success: 'rgba(74, 222, 128, 0.4)',
        error:   'rgba(255, 107, 107, 0.4)',
    };

    let banner = document.getElementById('status-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'status-banner';
        banner.style.cssText = `
            position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
            padding: 10px 20px; border-radius: 8px; font-size: 13px;
            border: 1px solid; z-index: 999; transition: opacity 0.4s;
            font-family: 'DM Sans', sans-serif; backdrop-filter: blur(8px);
        `;
        document.body.appendChild(banner);
    }

    banner.textContent     = message;
    banner.style.background  = colors[type];
    banner.style.borderColor = borders[type];
    banner.style.color       = '#f0e8f5';
    banner.style.opacity     = '1';

    clearTimeout(banner._timeout);
    banner._timeout = setTimeout(() => { banner.style.opacity = '0'; }, 3000);
}


// ============================================================
//   INIT APP
// ============================================================

async function initApp() {
    const cached = loadCache();
    if (cached.length > 0) {
        cars = cached;
        renderCards();
    }

    try {
        const freshData = await getCars();
        cars = freshData;
        saveCache();
        renderCards();
        if (cached.length > 0) {
            showStatus('✓ Données mises à jour', 'success');
        }
    } catch (error) {
        console.error('Erreur de chargement des données :', error);
        if (cached.length > 0) {
            showStatus('⚠ Données hors-ligne (cache local)', 'error');
        } else {
            showStatus('✗ Impossible de charger les données', 'error');
            renderCards();
        }
    }

    setViewToggleUI();
}


// ============================================================
//   VIEW TOGGLE
// ============================================================

function setViewToggleUI() {
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === currentView);
    });
}

function setView(view) {
    currentView = view;
    localStorage.setItem('autobase_view', view);
    setViewToggleUI();
    renderCards();
}


// ============================================================
//   FAVORIS
// ============================================================

function toggleFav(id, event) {
    event.stopPropagation();
    if (favIds.has(id)) {
        favIds.delete(id);
    } else {
        favIds.add(id);
    }
    saveFavs();
    renderCards();
}

function toggleFavsFilter() {
    showFavsOnly = !showFavsOnly;
    const chip = document.getElementById('fav-chip');
    if (chip) chip.classList.toggle('active', showFavsOnly);
    renderCards();
}


// ============================================================
//   EXPORT / IMPORT JSON
// ============================================================

function exportJSON() {
    const json = JSON.stringify(cars, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `fullthrottle_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) {
                alert(t('import_invalid'));
                return;
            }
            const existingIds = new Set(cars.map(c => c.id));
            let added = 0;
            imported.forEach(car => {
                if (!existingIds.has(car.id)) {
                    cars.push(car);
                    added++;
                }
            });
            saveCache();
            renderCards();
            alert(`${t('import_success')} : ${added} ${t('import_added')}`);
        } catch {
            alert(t('import_error'));
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}


// ============================================================
//   RENDU DES CARTES (grille + liste)
// ============================================================

function renderCards() {
    const query        = document.getElementById('search-input').value.toLowerCase();
    const typeFilter   = document.getElementById('filter-type').value;
    const energyFilter = document.getElementById('filter-energy').value;

    let filtered = cars.filter(car => {
        const matchQuery  = !query
            || car.marque.toLowerCase().includes(query)
            || car.modele.toLowerCase().includes(query)
            || (car.pays || '').toLowerCase().includes(query);
        const matchType   = !typeFilter   || car.type   === typeFilter;
        const matchEnergy = !energyFilter || car.energy === energyFilter;
        const matchFav    = !showFavsOnly || favIds.has(car.id);
        return matchQuery && matchType && matchEnergy && matchFav;
    });

    document.getElementById('total-count').textContent  = cars.length;
    document.getElementById('marque-count').textContent = [...new Set(cars.map(c => c.marque))].length;

    const count = filtered.length;
    document.getElementById('results-label').textContent =
        `${count} ${count <= 1 ? t('results_one') : t('results_many')}`;

    const grid = document.getElementById('cars-grid');

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="emoji">🔍</div>
                <h3>${t('empty_title')}</h3>
                <p>${t('empty_text')}</p>
            </div>`;
        grid.className = currentView === 'list' ? 'cars-list' : 'cars-grid';
        return;
    }

    if (currentView === 'list') {
        grid.className = 'cars-list';
        grid.innerHTML = filtered.map((car, i) => renderRowHTML(car, i)).join('');
    } else {
        grid.className = 'cars-grid';
        grid.innerHTML = filtered.map((car, i) => renderCardHTML(car, i)).join('');
    }
}

function renderCardHTML(car, i) {
    const colorE    = ENERGY_COLORS[car.energy] || 'var(--violet)';
    const typeLabel   = translateValue(car.type);
    const energyLabel = translateValue(car.energy);
    const paysLabel   = translateValue(car.pays);
    const tagType   = typeLabel   ? `<span class="tag">${typeLabel}</span>` : '';
    const tagEnergy = energyLabel ? `<span class="tag" style="color:${colorE};border-color:${colorE}33;background:${colorE}11">${energyLabel}</span>` : '';
    const tagPays   = paysLabel   ? `<span class="tag" style="color:var(--muted);border-color:rgba(255,255,255,0.1);background:rgba(255,255,255,0.04)">${paysLabel}</span>` : '';
    const power     = car.puissance ? `<strong>${car.puissance} ${currentLang === 'fr' ? 'ch' : 'hp'}</strong>` : '';
    const year      = car.annee  ? ` · ${car.annee}` : '';
    const soundIcon = car.sound  ? `<span class="card-sound-icon" title="Son moteur disponible">🔊</span>` : '';
    const initials  = (car.marque[0] || '') + (car.modele[0] || '');
    const isFav     = favIds.has(car.id);
    const isInCompare = compareIds.includes(car.id);

    const imgHtml = car.image
        ? `<img src="${car.image}" alt="${car.marque} ${car.modele}" class="card-real-img"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="card-img-placeholder" style="display:none">
               <span class="placeholder-initials">${initials}</span>
               <span class="placeholder-label">${car.marque}</span>
           </div>`
        : `<div class="card-img-placeholder">
               <span class="placeholder-initials">${initials}</span>
               <span class="placeholder-label">${car.marque}</span>
           </div>`;

    return `
        <div class="car-card${isInCompare ? ' compare-selected' : ''}" style="animation-delay:${i * 0.05}s${isInCompare ? ';outline:2px solid var(--violet)' : ''}" onclick="openDetail(${car.id})">
            <div class="card-img">
                ${imgHtml}
                <div class="card-img-overlay"></div>
                <div class="compare-check${isInCompare ? ' checked' : ''}" onclick="event.stopPropagation(); toggleCompare(${car.id})" title="Comparer">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 7h10M8 3l4 4-4 4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <button class="card-fav${isFav ? ' active' : ''}" onclick="toggleFav(${car.id}, event)" title="Favoris">
                    ${isFav ? '★' : '☆'}
                </button>
            </div>
            <div class="card-body">
                <div class="card-marque">${car.marque}</div>
                <div class="card-name">${car.modele}</div>
                <div class="card-tags">${tagType}${tagEnergy}${tagPays}</div>
                <div class="card-footer">
                    <div class="card-power">${power}${year}${soundIcon}</div>
                    <button class="card-delete" onclick="event.stopPropagation(); handleDelete(${car.id})" title="Supprimer">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                            <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>`;
}

function renderRowHTML(car, i) {
    const colorE      = ENERGY_COLORS[car.energy] || 'var(--violet)';
    const typeLabel   = translateValue(car.type);
    const energyLabel = translateValue(car.energy);
    const paysLabel   = translateValue(car.pays);
    const tagType   = typeLabel   ? `<span class="tag">${typeLabel}</span>` : '';
    const tagEnergy = energyLabel ? `<span class="tag" style="color:${colorE};border-color:${colorE}33;background:${colorE}11">${energyLabel}</span>` : '';
    const initials  = (car.marque[0] || '') + (car.modele[0] || '');
    const isFav     = favIds.has(car.id);

    const thumbHtml = car.image
        ? `<img src="${car.image}" alt="${car.marque} ${car.modele}"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="car-row-thumb-placeholder" style="display:none">${initials}</div>`
        : `<div class="car-row-thumb-placeholder">${initials}</div>`;

    return `
        <div class="car-row" style="animation-delay:${i * 0.04}s" onclick="openDetail(${car.id})">
            <div class="car-row-thumb">${thumbHtml}</div>
            <div class="car-row-info">
                <div class="car-row-name">${car.marque} ${car.modele}</div>
                <div class="car-row-sub">${[car.annee, paysLabel].filter(Boolean).join(' · ')}</div>
            </div>
            <div class="car-row-tags">${tagType}${tagEnergy}</div>
            <div class="car-row-stats">
                ${car.puissance    ? `<div class="car-row-stat"><div class="car-row-stat-val">${car.puissance}</div><div class="car-row-stat-label">${currentLang === 'fr' ? 'ch' : 'hp'}</div></div>` : ''}
                ${car.acceleration ? `<div class="car-row-stat"><div class="car-row-stat-val">${car.acceleration}s</div><div class="car-row-stat-label">0-100</div></div>` : ''}
                ${car.vmax         ? `<div class="car-row-stat"><div class="car-row-stat-val">${car.vmax}</div><div class="car-row-stat-label">km/h</div></div>` : ''}
            </div>
            <div class="car-row-actions">
                <button style="background:none;border:none;color:${isFav ? 'var(--yellow)' : 'var(--muted)'};font-size:16px;cursor:pointer;padding:4px" onclick="toggleFav(${car.id}, event)">${isFav ? '★' : '☆'}</button>
                <button class="card-delete" onclick="event.stopPropagation(); handleDelete(${car.id})" title="Supprimer" style="background:none;border:none;color:var(--muted);cursor:pointer;padding:4px;display:flex;align-items:center">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        </div>`;
}


// ============================================================
//   COMPARATEUR
// ============================================================

function toggleCompare(id) {
    if (compareIds.includes(id)) {
        compareIds = compareIds.filter(i => i !== id);
    } else {
        if (compareIds.length >= 2) {
            showStatus(currentLang === 'fr' ? '⚠ Maximum 2 véhicules à comparer' : '⚠ Maximum 2 vehicles to compare', 'info');
            return;
        }
        compareIds.push(id);
    }
    updateCompareBar();
    renderCards();
}

function updateCompareBar() {
    const bar = document.getElementById('compare-bar');
    if (!bar) return;

    bar.classList.toggle('visible', compareIds.length > 0);

    const slots = bar.querySelectorAll('.compare-slot');
    slots.forEach((slot, i) => {
        const id = compareIds[i];
        if (id) {
            const car = cars.find(c => c.id === id);
            slot.className = 'compare-slot filled';
            slot.innerHTML = `
                <span>${car ? `${car.marque} ${car.modele}` : '?'}</span>
                <span class="compare-slot-remove" onclick="toggleCompare(${id})">✕</span>`;
        } else {
            slot.className = 'compare-slot';
            slot.innerHTML = currentLang === 'fr' ? 'Slot libre' : 'Empty slot';
        }
    });

    const btn = bar.querySelector('.btn-compare-go');
    if (btn) btn.disabled = compareIds.length < 2;
}

function clearCompare() {
    compareIds = [];
    updateCompareBar();
    renderCards();
}

function openCompare() {
    if (compareIds.length < 2) return;
    const [a, b] = compareIds.map(id => cars.find(c => c.id === id));
    if (!a || !b) return;

    const overlay   = document.getElementById('compare-overlay');
    const container = document.getElementById('compare-content');

    const statRows = [
        { key: 'puissance',    label: currentLang === 'fr' ? 'Puissance' : 'Power',       unit: currentLang === 'fr' ? 'ch' : 'hp', higher: true },
        { key: 'couple',       label: currentLang === 'fr' ? 'Couple' : 'Torque',         unit: 'Nm',   higher: true },
        { key: 'vmax',         label: currentLang === 'fr' ? 'Vmax' : 'Top speed',        unit: 'km/h', higher: true },
        { key: 'acceleration', label: '0-100',                                              unit: 's',    higher: false },
        { key: 'cylindree',    label: currentLang === 'fr' ? 'Cylindrée' : 'Displacement', unit: 'cm³',  higher: true },
    ].filter(s => a[s.key] != null || b[s.key] != null);

    const heroA = buildCompareHero(a);
    const heroB = buildCompareHero(b);

    const rowsHTML = statRows.map(s => {
        const va = a[s.key], vb = b[s.key];
        const aWins = va != null && vb != null && (s.higher ? va > vb : va < vb);
        const bWins = va != null && vb != null && (s.higher ? vb > va : vb < va);
        return `
            <div class="compare-spec-row">
                <div class="compare-spec-val left ${va != null ? (aWins ? 'winner' : (bWins ? 'loser' : '')) : ''}">
                    ${va != null ? va + `<span style="font-family:'DM Sans';font-size:11px;color:var(--muted);margin-left:3px">${s.unit}</span>` : '—'}
                </div>
                <div class="compare-spec-label">${s.label}</div>
                <div class="compare-spec-val right ${vb != null ? (bWins ? 'winner' : (aWins ? 'loser' : '')) : ''}">
                    ${vb != null ? vb + `<span style="font-family:'DM Sans';font-size:11px;color:var(--muted);margin-left:3px">${s.unit}</span>` : '—'}
                </div>
            </div>`;
    }).join('');

    const maxPow   = Math.max(a.puissance || 0, b.puissance || 0, 1);
    const maxVmax  = Math.max(a.vmax      || 0, b.vmax      || 0, 1);
    const maxCouple = Math.max(a.couple   || 0, b.couple    || 0, 1);

    const barsHTML = `
        <div class="compare-bar-wrap">
            ${buildCompareBarItem(currentLang === 'fr' ? 'Puissance' : 'Power', a, b, 'puissance', maxPow,   currentLang === 'fr' ? 'ch' : 'hp')}
            ${buildCompareBarItem('Vmax',                                         a, b, 'vmax',      maxVmax,  'km/h')}
            ${buildCompareBarItem(currentLang === 'fr' ? 'Couple' : 'Torque',    a, b, 'couple',    maxCouple,'Nm')}
        </div>`;

    container.innerHTML = `
        <div class="compare-cars-grid" style="margin-bottom:28px">
            ${heroA}${heroB}
        </div>
        ${rowsHTML ? `<div class="compare-specs">${rowsHTML}</div>` : ''}
        ${barsHTML}`;

    overlay.classList.add('open');
}

function buildCompareHero(car) {
    return `
        <div class="compare-car-hero">
            ${car.image ? `<img src="${car.image}" alt="${car.marque} ${car.modele}" onerror="this.style.display='none'">` : ''}
            <div class="compare-car-hero-overlay">
                <div>
                    <div class="compare-car-hero-sub">${car.marque}</div>
                    <div class="compare-car-hero-name">${car.modele}</div>
                </div>
            </div>
        </div>`;
}

function buildCompareBarItem(label, a, b, key, maxVal, unit) {
    if (!a[key] && !b[key]) return '';
    const pctA = maxVal > 0 ? Math.round((a[key] || 0) / maxVal * 100) : 0;
    const pctB = maxVal > 0 ? Math.round((b[key] || 0) / maxVal * 100) : 0;
    return `
        <div class="compare-bar-item">
            <div class="compare-bar-label">${label}</div>
            <div class="compare-bar-tracks">
                <div class="compare-bar-track">
                    <div class="compare-bar-car-name">${a.marque} ${a.modele.slice(0,8)}</div>
                    <div class="compare-bar-fill-wrap">
                        <div class="compare-bar-fill a" style="width:${pctA}%"></div>
                    </div>
                    <div class="compare-bar-val">${a[key] || '—'} <span style="font-size:10px;color:var(--muted)">${a[key] ? unit : ''}</span></div>
                </div>
                <div class="compare-bar-track">
                    <div class="compare-bar-car-name">${b.marque} ${b.modele.slice(0,8)}</div>
                    <div class="compare-bar-fill-wrap">
                        <div class="compare-bar-fill b" style="width:${pctB}%"></div>
                    </div>
                    <div class="compare-bar-val">${b[key] || '—'} <span style="font-size:10px;color:var(--muted)">${b[key] ? unit : ''}</span></div>
                </div>
            </div>
        </div>`;
}

function closeCompare() {
    document.getElementById('compare-overlay').classList.remove('open');
}


// ============================================================
//   DASHBOARD STATISTIQUES
// ============================================================

function openStats() {
    document.getElementById('stats-overlay').classList.add('open');
    renderStats();
}

function closeStats() {
    document.getElementById('stats-overlay').classList.remove('open');
}

function renderStats() {
    const avgPow  = Math.round(cars.filter(c => c.puissance).reduce((s, c) => s + c.puissance, 0) / (cars.filter(c => c.puissance).length || 1));
    const maxPow  = Math.max(...cars.map(c => c.puissance || 0));
    const avgAccel = (cars.filter(c => c.acceleration).reduce((s, c) => s + c.acceleration, 0) / (cars.filter(c => c.acceleration).length || 1)).toFixed(1);
    const brands  = [...new Set(cars.map(c => c.marque))].length;

    document.getElementById('stat-avg-pow').textContent = avgPow  || '—';
    document.getElementById('stat-max-pow').textContent = maxPow  || '—';
    document.getElementById('stat-avg-acc').textContent = avgAccel;
    document.getElementById('stat-brands').textContent  = brands;

    // Répartition par type
    const byType = {};
    cars.forEach(c => { if (c.type) byType[c.type] = (byType[c.type] || 0) + 1; });
    const sortedTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    const maxTypeCount = sortedTypes[0]?.[1] || 1;
    document.getElementById('stat-by-type').innerHTML = sortedTypes.map(([name, count]) => `
        <div class="stats-bar-row">
            <div class="stats-bar-name">${translateValue(name)}</div>
            <div class="stats-bar-track">
                <div class="stats-bar-inner" style="width:0%" data-target="${Math.round(count/maxTypeCount*100)}"></div>
            </div>
            <div class="stats-bar-count">${count}</div>
        </div>`).join('');

    // Répartition par énergie (donut)
    const byEnergy = {};
    cars.forEach(c => { if (c.energy) byEnergy[c.energy] = (byEnergy[c.energy] || 0) + 1; });
    const energyEntries = Object.entries(byEnergy).sort((a, b) => b[1] - a[1]);
    const donutColors   = ['#EE82EE','#4ade80','#60a5fa','#fbbf24','#f87171'];

    document.getElementById('stat-energy-legend').innerHTML = energyEntries.map(([name, count], i) => `
        <div class="stats-legend-item">
            <div class="stats-legend-dot" style="background:${donutColors[i] || '#888'}"></div>
            ${translateValue(name)} (${count})
        </div>`).join('');

    const ctx = document.getElementById('stat-donut').getContext('2d');
    if (window._donutChart) window._donutChart.destroy();
    window._donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: energyEntries.map(e => translateValue(e[0])),
            datasets: [{
                data: energyEntries.map(e => e[1]),
                backgroundColor: donutColors.slice(0, energyEntries.length),
                borderColor: '#0e0618',
                borderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
        }
    });

    // Top puissances
    const topPow = [...cars].filter(c => c.puissance).sort((a, b) => b.puissance - a.puissance).slice(0, 5);
    document.getElementById('stat-top-list').innerHTML = topPow.map((car, i) => `
        <div class="stats-top-item" onclick="closeStats(); setTimeout(() => openDetail(${car.id}), 200)">
            <div class="stats-top-rank">${i + 1}</div>
            <div class="stats-top-name">${car.marque} ${car.modele}</div>
            <div class="stats-top-val">${car.puissance} <span style="font-size:12px;color:var(--muted)">${currentLang === 'fr' ? 'ch' : 'hp'}</span></div>
        </div>`).join('');

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.querySelectorAll('.stats-bar-inner[data-target]').forEach(el => {
                el.style.width = el.dataset.target + '%';
            });
        });
    });
}


// ============================================================
//   FICHE DÉTAIL
// ============================================================

let currentDetailId = null;

function openDetail(id) {
    const car = cars.find(c => c.id === id);
    if (!car) return;
    currentDetailId = id;

    const hero = document.getElementById('detail-hero');
    hero.style.backgroundImage = car.image ? `url('${car.image}')` : '';

    document.getElementById('detail-marque').textContent = car.marque;
    document.getElementById('detail-name').textContent   = car.modele;
    document.getElementById('detail-sub').textContent    =
        [car.annee, translateValue(car.pays), translateValue(car.type)].filter(Boolean).join(' · ');

    const audio    = document.getElementById('motor-audio');
    const soundBtn = document.getElementById('sound-btn');
    audio.pause(); audio.src = '';
    soundBtn.classList.remove('playing');
    soundBtn.textContent   = '🔊';
    soundBtn.style.display = car.sound ? 'flex' : 'none';
    if (car.sound) audio.src = car.sound;

    const descEl   = document.getElementById('detail-description');
    const descText = currentLang === 'en'
        ? (car.description_en || car.description_fr || car.description || '')
        : (car.description_fr || car.description || '');
    descEl.textContent   = descText;
    descEl.style.display = descText ? 'block' : 'none';

    const specs = [
        [t('spec_power'),        car.puissance,    currentLang === 'fr' ? 'ch' : 'hp'],
        [t('spec_torque'),       car.couple,       'Nm'],
        [t('spec_displacement'), car.cylindree,    'cm³'],
        [t('spec_cylinders'),    car.cylindres,    'cyl.'],
        [t('spec_accel'),        car.acceleration, 's'],
        [t('spec_vmax'),         car.vmax,         'km/h'],
        [t('spec_engine'),       translateValue(car.energy), ''],
        [t('spec_year'),         car.annee,        ''],
    ];

    const specsHtml = specs
        .filter(([, val]) => val !== null && val !== undefined && val !== '')
        .map(([label, val, unit]) => `
            <div class="spec-item">
                <div class="spec-label">${label}</div>
                <div class="spec-value">${val}<span class="spec-unit">${unit}</span></div>
            </div>`)
        .join('');

    document.getElementById('specs-grid').innerHTML =
        specsHtml || `<p style="color:var(--muted);font-size:14px">${t('no_specs')}</p>`;

    // Performance bars
    const perfContainer = document.getElementById('perf-bars');
    const perfBars = [
        { label: currentLang === 'fr' ? 'Puissance' : 'Power',  val: car.puissance,    max: MAX_REF.puissance,    unit: currentLang === 'fr' ? 'ch' : 'hp' },
        { label: currentLang === 'fr' ? 'Couple' : 'Torque',    val: car.couple,       max: MAX_REF.couple,       unit: 'Nm' },
        { label: 'Vmax',                                          val: car.vmax,         max: MAX_REF.vmax,         unit: 'km/h' },
        { label: '0-100',                                         val: car.acceleration, max: MAX_REF.acceleration, unit: 's', invert: true },
    ].filter(b => b.val != null);

    if (perfBars.length > 0) {
        perfContainer.style.display = 'block';
        document.getElementById('perf-bars-inner').innerHTML = perfBars.map(b => {
            const pct = b.invert
                ? Math.round((1 - b.val / b.max) * 100)
                : Math.round(b.val / b.max * 100);
            return `
                <div class="perf-bar-row">
                    <div class="perf-bar-header">
                        <div class="perf-bar-name">${b.label}</div>
                        <div class="perf-bar-val">${b.val} ${b.unit}</div>
                    </div>
                    <div class="perf-bar-track">
                        <div class="perf-bar-fill" style="width:0%" data-target="${Math.min(pct, 100)}%"></div>
                    </div>
                </div>`;
        }).join('');
    } else {
        perfContainer.style.display = 'none';
    }

    document.getElementById('detail-overlay').classList.add('open');

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.querySelectorAll('.perf-bar-fill[data-target]').forEach(el => {
                el.style.width = el.dataset.target;
            });
        });
    });
}

function closeDetail() {
    document.getElementById('detail-overlay').classList.remove('open');
    const audio = document.getElementById('motor-audio');
    audio.pause(); audio.src = '';
    document.getElementById('sound-btn').classList.remove('playing');
    document.getElementById('sound-btn').textContent = '🔊';
    currentDetailId = null;
}

function closeDetailOutside(event) {
    if (event.target === document.getElementById('detail-overlay')) closeDetail();
}

function editCurrent() {
    const id = currentDetailId;
    closeDetail();
    openModal('edit', id);
}

function deleteCurrent() {
    if (confirm(t('delete_confirm'))) {
        handleDelete(currentDetailId);
        closeDetail();
    }
}


// ============================================================
//   SON MOTEUR
// ============================================================

function toggleSound() {
    const audio    = document.getElementById('motor-audio');
    const soundBtn = document.getElementById('sound-btn');

    if (audio.paused) {
        audio.play()
            .then(() => {
                soundBtn.classList.add('playing');
                soundBtn.textContent = '⏹';
            })
            .catch(() => alert(t('sound_error')));
    } else {
        audio.pause();
        audio.currentTime = 0;
        soundBtn.classList.remove('playing');
        soundBtn.textContent = '🔊';
    }
}


// ============================================================
//   SUPPRESSION
// ============================================================

async function handleDelete(id) {
    try {
        await deleteCar(id);
        cars = cars.filter(car => car.id !== id);
        compareIds = compareIds.filter(i => i !== id);
        favIds.delete(id);
        saveFavs();
        saveCache();
        updateCompareBar();
        renderCards();
        showStatus(currentLang === 'fr' ? '🗑 Véhicule supprimé' : '🗑 Vehicle deleted', 'info');
    } catch (error) {
        console.error('Erreur lors de la suppression :', error);
        showStatus(currentLang === 'fr' ? '✗ Erreur lors de la suppression' : '✗ Error deleting vehicle', 'error');
    }
}


// ============================================================
//   MODALE AJOUT / ÉDITION
// ============================================================

let editingId = null;

function openModal(mode = 'add', id = null) {
    editingId = null;

    if (mode === 'edit' && id !== null) {
        const car = cars.find(c => c.id === id);
        if (!car) return;
        editingId = id;

        document.getElementById('f-marque').value       = car.marque        || '';
        document.getElementById('f-modele').value       = car.modele        || '';
        document.getElementById('f-annee').value        = car.annee         || '';
        document.getElementById('f-pays').value         = car.pays          || '';
        document.getElementById('f-type').value         = car.type          || '';
        document.getElementById('f-energy').value       = car.energy        || '';
        document.getElementById('f-puissance').value    = car.puissance     || '';
        document.getElementById('f-couple').value       = car.couple        || '';
        document.getElementById('f-cylindree').value    = car.cylindree     || '';
        document.getElementById('f-cylindres').value    = car.cylindres     || '';
        document.getElementById('f-acceleration').value = car.acceleration  || '';
        document.getElementById('f-vmax').value         = car.vmax          || '';
        document.getElementById('f-image').value           = car.image          || '';
        document.getElementById('f-sound').value           = car.sound          || '';
        document.getElementById('f-description-fr').value  = car.description_fr || car.description || '';
        document.getElementById('f-description-en').value  = car.description_en || '';

        document.getElementById('modal-title').textContent      = t('modal_edit_title');
        document.getElementById('modal-submit-btn').textContent = t('modal_edit_btn');
    } else {
        clearForm();
        document.getElementById('modal-title').textContent      = t('modal_add_title');
        document.getElementById('modal-submit-btn').textContent = t('modal_add_btn');
    }

    document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    clearForm();
    editingId = null;
}

function closeModalOutside(event) {
    if (event.target === document.getElementById('modal-overlay')) closeModal();
}

function clearForm() {
    ['f-marque','f-modele','f-annee','f-pays','f-puissance','f-couple',
     'f-cylindree','f-cylindres','f-acceleration','f-vmax','f-image','f-sound',
     'f-description-fr','f-description-en']
        .forEach(id => {
            document.getElementById(id).value = '';
            document.getElementById(id).style.borderColor = '';
        });
    document.getElementById('f-type').value   = '';
    document.getElementById('f-energy').value = '';
}


// ============================================================
//   SOUMISSION DU FORMULAIRE
// ============================================================

async function submitCar() {
    const marque = document.getElementById('f-marque').value.trim();
    const modele = document.getElementById('f-modele').value.trim();

    if (!marque || !modele) {
        document.getElementById('f-marque').style.borderColor = marque ? '' : '#ff6b6b';
        document.getElementById('f-modele').style.borderColor = modele ? '' : '#ff6b6b';
        return;
    }

    const carData = {
        marque, modele,
        annee:        parseInt(document.getElementById('f-annee').value)          || null,
        pays:         document.getElementById('f-pays').value.trim()              || '',
        type:         document.getElementById('f-type').value,
        energy:       document.getElementById('f-energy').value,
        puissance:    parseInt(document.getElementById('f-puissance').value)      || null,
        couple:       parseInt(document.getElementById('f-couple').value)         || null,
        cylindree:    parseInt(document.getElementById('f-cylindree').value)      || null,
        cylindres:    parseInt(document.getElementById('f-cylindres').value)      || null,
        acceleration: parseFloat(document.getElementById('f-acceleration').value) || null,
        vmax:         parseInt(document.getElementById('f-vmax').value)           || null,
        image:          document.getElementById('f-image').value.trim()          || '',
        sound:          document.getElementById('f-sound').value.trim()          || '',
        description_fr: document.getElementById('f-description-fr').value.trim() || '',
        description_en: document.getElementById('f-description-en').value.trim() || '',
        description:    document.getElementById('f-description-fr').value.trim() || '',
    };

    try {
        if (editingId !== null) {
            const updated = await updateCar(editingId, carData);
            const index = cars.findIndex(c => c.id === editingId);
            if (index !== -1) cars[index] = updated;
            showStatus(currentLang === 'fr' ? '✓ Véhicule modifié' : '✓ Vehicle updated', 'success');
        } else {
            const created = await addCar(carData);
            cars.push(created);
            showStatus(currentLang === 'fr' ? '✓ Véhicule ajouté' : '✓ Vehicle added', 'success');
        }

        saveCache();
        closeModal();
        renderCards();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde :', error);
        showStatus(currentLang === 'fr' ? '✗ Erreur lors de la sauvegarde' : '✗ Error saving vehicle', 'error');
    }
}


// ============================================================
//   INITIALISATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});