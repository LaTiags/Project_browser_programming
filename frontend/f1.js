// ============================================================
//   f1.js — Données F1 en temps réel via Jolpica API
//
//   Jolpica est le successeur officiel de l'API Ergast,
//   dépréciée fin 2024. Elle expose exactement les mêmes
//   endpoints et le même format JSON.
//
//   API base URL : https://api.jolpi.ca/ergast/f1
//   Documentation : https://github.com/jolpica/jolpica-f1
//
//   Endpoints utilisés :
//     /current/driverStandings.json      → classement pilotes saison en cours
//     /current/constructorStandings.json → classement constructeurs
//     /current/last/results.json         → résultats de la dernière course
//
//   Les données sont mises en cache dans localStorage pendant
//   30 minutes pour éviter de surcharger l'API.
// ============================================================

const F1_API     = 'https://api.jolpi.ca/ergast/f1';
const CACHE_TTL  = 30 * 60 * 1000; // 30 minutes en millisecondes

// Couleurs officielles des écuries F1 2025
// Utilisées pour les barres et badges dans le classement constructeurs
const TEAM_COLORS = {
    'red_bull':         '#3671C6',
    'ferrari':          '#E8002D',
    'mercedes':         '#27F4D2',
    'mclaren':          '#FF8000',
    'aston_martin':     '#229971',
    'alpine':           '#FF87BC',
    'williams':         '#64C4FF',
    'rb':               '#6692FF',
    'haas':             '#B6BABD',
    'kick_sauber':      '#52E252',
    'sauber':           '#52E252',
};

// Drapeaux des nationalités des pilotes
const COUNTRY_FLAGS = {
    'British':     '🇬🇧', 'Dutch':        '🇳🇱', 'Monégasque':   '🇲🇨',
    'Spanish':     '🇪🇸', 'Mexican':      '🇲🇽', 'German':       '🇩🇪',
    'Australian':  '🇦🇺', 'Canadian':     '🇨🇦', 'Finnish':      '🇫🇮',
    'French':      '🇫🇷', 'Japanese':     '🇯🇵', 'Thai':         '🇹🇭',
    'Chinese':     '🇨🇳', 'American':     '🇺🇸', 'Danish':       '🇩🇰',
    'Italian':     '🇮🇹', 'Brazilian':    '🇧🇷', 'Argentine':    '🇦🇷',
    'New Zealander':'🇳🇿', 'Austrian':    '🇦🇹',
};


// ============================================================
//   CACHE localStorage
//
//   Chaque données est stockée avec un timestamp.
//   Si les données ont moins de 30 min, on les utilise
//   sans refaire une requête à l'API.
// ============================================================

function getCached(key) {
    try {
        const raw = localStorage.getItem(`f1_${key}`);
        if (!raw) return null;
        const { data, timestamp } = JSON.parse(raw);
        // Vérifie que le cache n'est pas expiré
        if (Date.now() - timestamp > CACHE_TTL) return null;
        return data;
    } catch { return null; }
}

function setCache(key, data) {
    try {
        localStorage.setItem(`f1_${key}`, JSON.stringify({
            data,
            timestamp: Date.now(),
        }));
    } catch (e) { console.warn('Cache localStorage plein :', e); }
}


// ============================================================
//   fetchF1() — Appel générique à l'API Jolpica
//
//   Vérifie le cache avant de faire la requête.
//   Retourne les données JSON parsées.
// ============================================================

async function fetchF1(endpoint, cacheKey) {
    // Retourne le cache si encore valide
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${F1_API}${endpoint}`);
    if (!response.ok) throw new Error(`API F1 : ${response.status}`);

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
}


// ============================================================
//   loadAll() — Point d'entrée principal
//   Charge les 3 sections en parallèle avec Promise.all()
//
//   Promise.all() attend que TOUTES les promesses soient
//   résolues avant de continuer — plus rapide qu'attendre
//   chaque appel un par un (3 appels simultanés).
// ============================================================

async function loadAll() {
    const btn = document.getElementById('btn-refresh');
    btn.classList.add('spinning');

    try {
        // Lance les 3 appels en parallèle
        await Promise.all([
            loadDriverStandings(),
            loadConstructorStandings(),
            loadLastRace(),
        ]);

        // Met à jour l'heure de dernière mise à jour
        const now = new Date();
        document.getElementById('last-update').textContent =
            `${t('f1_updated')} ${now.toLocaleTimeString(currentLang === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    } catch (error) {
        console.error('Erreur chargement F1 :', error);
    } finally {
        btn.classList.remove('spinning');
    }
}


// ============================================================
//   loadDriverStandings() — Classement des pilotes
// ============================================================

async function loadDriverStandings() {
    const el = document.getElementById('drivers-standings');

    try {
        const data = await fetchF1('/current/driverStandings.json', 'drivers');

        // Navigation dans la structure JSON de l'API Jolpica
        // data.MRData.StandingsTable.StandingsLists[0].DriverStandings
        const standings = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];

        if (standings.length === 0) {
            el.innerHTML = `<div class="error-state"><p>${t('f1_no_data')}</p></div>`;
            return;
        }

        // Points du leader pour calculer les barres de progression
        const maxPoints = parseFloat(standings[0]?.points || 1);

        el.innerHTML = `
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>${t('f1_driver_col')}</th>
                        <th style="text-align:right">${t('f1_pts_col')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${standings.slice(0, 10).map(s => {
                        const pos    = parseInt(s.position);
                        const flag   = COUNTRY_FLAGS[s.Driver.nationality] || '';
                        const pts    = parseFloat(s.points);
                        const pct    = Math.round((pts / maxPoints) * 100);
                        const posClass = pos <= 3 ? `pos-${pos}` : '';

                        return `
                            <tr>
                                <td><div class="pos ${posClass}">${pos}</div></td>
                                <td>
                                    <div class="driver-name">
                                        ${flag} ${s.Driver.givenName} ${s.Driver.familyName}
                                    </div>
                                    <div class="driver-team">${s.Constructors?.[0]?.name || ''}</div>
                                    <div class="points-bar-wrap">
                                        <div class="points-bar" style="width:${pct}%"></div>
                                    </div>
                                </td>
                                <td>
                                    <div class="points">${pts}</div>
                                    <div class="points-label">${t('f1_pts')}</div>
                                </td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>`;

    } catch (error) {
        el.innerHTML = `<div class="error-state"><div class="emoji">⚠️</div><p>${t('f1_error')} : ${error.message}</p></div>`;
    }
}


// ============================================================
//   loadConstructorStandings() — Classement constructeurs
// ============================================================

async function loadConstructorStandings() {
    const el = document.getElementById('constructors-standings');

    try {
        const data = await fetchF1('/current/constructorStandings.json', 'constructors');
        const standings = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];

        if (standings.length === 0) {
            el.innerHTML = `<div class="error-state"><p>${t('f1_no_data')}</p></div>`;
            return;
        }

        const maxPoints = parseFloat(standings[0]?.points || 1);

        el.innerHTML = `
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>${t('f1_team_col')}</th>
                        <th style="text-align:right">${t('f1_pts_col')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${standings.map(s => {
                        const pos      = parseInt(s.position);
                        const pts      = parseFloat(s.points);
                        const pct      = Math.round((pts / maxPoints) * 100);
                        const color    = TEAM_COLORS[s.Constructor.constructorId] || '#888';
                        const posClass = pos <= 3 ? `pos-${pos}` : '';

                        return `
                            <tr>
                                <td><div class="pos ${posClass}">${pos}</div></td>
                                <td>
                                    <div class="driver-name">
                                        <span class="team-color" style="background:${color}"></span>
                                        ${s.Constructor.name}
                                    </div>
                                    <div class="driver-team">${s.wins} ${parseInt(s.wins) > 1 ? t('f1_wins') : t('f1_win')}</div>
                                    <div class="points-bar-wrap">
                                        <div class="points-bar" style="width:${pct}%;background:${color}"></div>
                                    </div>
                                </td>
                                <td>
                                    <div class="points">${pts}</div>
                                    <div class="points-label">${t('f1_pts')}</div>
                                </td>
                            </tr>`;
                    }).join('')}
                </tbody>
            </table>`;

    } catch (error) {
        el.innerHTML = `<div class="error-state"><div class="emoji">⚠️</div><p>${t('f1_error')} : ${error.message}</p></div>`;
    }
}


// ============================================================
//   loadLastRace() — Résultats de la dernière course
// ============================================================

async function loadLastRace() {
    const el = document.getElementById('last-race-section');

    try {
        const data = await fetchF1('/current/last/results.json', 'lastrace');

        // La structure retourne un tableau de courses avec leurs résultats
        const race    = data?.MRData?.RaceTable?.Races?.[0];
        const results = race?.Results || [];

        if (!race || results.length === 0) {
            el.innerHTML = `<div class="error-state"><div class="emoji">🏁</div><p>${t('f1_no_race')}</p></div>`;
            return;
        }

        // Formate la date de la course
        const raceDate = new Date(race.date).toLocaleDateString(currentLang === 'en' ? 'en-GB' : 'fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        el.innerHTML = `
            <div class="race-card">
                <div class="race-header">
                    <div>
                        <div class="race-name">🏁 ${race.raceName}</div>
                        <div class="race-meta">
                            ${race.Circuit?.circuitName} · ${raceDate} · ${t('f1_round')} ${race.round}
                        </div>
                    </div>
                    <div class="race-badge">${t('f1_season')} ${race.season}</div>
                </div>
                <div class="race-results">
                    ${results.slice(0, 10).map(r => {
                        const pos      = parseInt(r.position);
                        const flag     = COUNTRY_FLAGS[r.Driver.nationality] || '';
                        const color    = TEAM_COLORS[r.Constructor.constructorId] || '#888';
                        const posClass = pos <= 3 ? `pos-${pos}` : '';
                        // Temps affiché : temps officiel ou statut (ex: "+Lap", "DNF")
                        const time     = r.Time?.time || r.status || '—';
                        const pts      = r.points;

                        return `
                            <div class="race-result-row">
                                <div class="race-pos ${posClass}">${pos}</div>
                                <div class="race-driver">
                                    <div class="race-driver-name">${flag} ${r.Driver.givenName} ${r.Driver.familyName}</div>
                                    <div class="race-driver-team">
                                        <span class="team-color" style="background:${color}"></span>
                                        ${r.Constructor.name}
                                    </div>
                                </div>
                                <div class="race-time">${time}</div>
                                <div class="race-pts">+${pts}</div>
                            </div>`;
                    }).join('')}
                </div>
            </div>`;

    } catch (error) {
        el.innerHTML = `<div class="error-state"><div class="emoji">⚠️</div><p>${t('f1_error')} : ${error.message}</p></div>`;
    }
}


// ============================================================
//   AUTO-REFRESH toutes les 5 minutes
//   Quand une course est en cours le week-end,
//   les données se mettent à jour automatiquement.
// ============================================================

// Démarre au chargement de la page
loadAll();

// Rafraîchit toutes les 5 minutes (300 000 ms)
setInterval(() => {
    // Vide le cache pour forcer un vrai appel API
    ['drivers', 'constructors', 'lastrace'].forEach(k => {
        localStorage.removeItem(`f1_${k}`);
    });
    loadAll();
}, 5 * 60 * 1000);

// ============================================================
//   Hook langue — quand on change de langue sur la page F1,
//   on re-rend les tableaux pour traduire les textes générés
//   dynamiquement (colonnes, labels, badges)
// ============================================================
document.addEventListener('langChanged', () => {
    // Vide le cache pour forcer le re-rendu avec les nouveaux labels
    loadDriverStandings();
    loadConstructorStandings();
    loadLastRace();
});