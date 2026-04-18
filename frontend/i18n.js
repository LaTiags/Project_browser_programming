// ============================================================
//   i18n.js — Système de traduction FR / EN (version améliorée)
// ============================================================

const TRANSLATIONS = {

    fr: {
        subtitle:       'Base de données automobile',
        import:         '⬆ Importer JSON',
        export:         '⬇ Exporter JSON',
        add_vehicle:    'Ajouter un véhicule',

        vehicles:       'véhicules',
        brands:         'marques',
        stats_btn:      'Statistiques',
        favs_only:      'Favoris',

        search_placeholder: 'Rechercher un modèle, une marque…',
        all_categories: 'Toutes catégories',
        all_engines:    'Toutes motorisations',

        results_one:    'résultat',
        results_many:   'résultats',

        modal_add_title:  'Nouveau véhicule',
        modal_edit_title: 'Modifier le véhicule',
        modal_sub:        'Remplis les informations du modèle',
        modal_add_btn:    'Ajouter à la base 🚀',
        modal_edit_btn:   'Enregistrer ✅',

        brand:          'Marque *',
        brand_ph:       'ex: Ferrari',
        model:          'Modèle *',
        model_ph:       'ex: 488 GTB',
        year:           'Année',
        country:        "Pays d'origine",
        country_ph:     'ex: Italie',
        category:       'Catégorie',
        engine_type:    'Motorisation',
        select:         '— Sélectionner —',

        section_engine: '⚙️ Caractéristiques moteur',
        power:          'Puissance (ch)',
        torque:         'Couple (Nm)',
        displacement:   'Cylindrée (cm³)',
        cylinders:      'Cylindres',
        acceleration:   '0-100 km/h (s)',
        top_speed:      'Vmax (km/h)',

        section_media:  '🖼️ Médias',
        image_url:      'URL image de fond',
        image_ph:       'https://... (.jpg/.png)',
        sound_url:      'URL son moteur',
        sound_ph:       'https://... (.mp3)',

        section_desc:   '📝 Description',
        description:    'Description du modèle',
        desc_ph:        'Présentation du modèle, histoire, particularités…',
        desc_fr:        '🇫🇷 Description (français)',
        desc_fr_ph:     'Présentation du modèle en français…',
        desc_en:        '🇬🇧 Description (English)',
        desc_en_ph:     'Model description in English…',
        translate_btn:  '🌐 Traduire automatiquement en anglais',
        translate_hint: 'MyMemory traduit gratuitement (1000/jour)',
        translating:    '⏳ Traduction en cours…',
        translate_ok:   '✅ Traduit !',
        translate_err:  '❌ Erreur de traduction — tu peux écrire la traduction manuellement',
        translate_empty:'⚠ Écris d abord une description en français',

        cancel:         'Annuler',
        edit:           '✏️ Modifier',
        delete:         '🗑 Supprimer',
        close:          '✕ Fermer',

        specs_title:    'Caractéristiques techniques',
        no_specs:       'Aucune donnée technique renseignée.',
        perf_title:     'Performances',

        spec_power:       'Puissance',
        spec_torque:      'Couple',
        spec_displacement:'Cylindrée',
        spec_cylinders:   'Cylindres',
        spec_accel:       '0 à 100',
        spec_vmax:        'Vmax',
        spec_engine:      'Motorisation',
        spec_year:        'Année',

        empty_title:    'Aucun résultat',
        empty_text:     'Essaie avec d\'autres termes ou ajoute ce véhicule !',

        import_success: '✅ Import réussi',
        import_added:   'véhicule(s) ajouté(s).',
        import_invalid: 'Fichier JSON invalide : le fichier doit contenir un tableau de véhicules.',
        import_error:   'Erreur lors de la lecture du fichier JSON.',
        sound_error:    "Impossible de lire ce fichier audio. Vérifie l'URL du son.",
        delete_confirm: 'Supprimer ce véhicule de la base ?',

        lang_switch:    '🌐 EN',

        // Comparateur
        compare_label:  'Comparer',
        compare_go:     '⚡ Comparer',
        compare_clear:  'Effacer',
        compare_title:  'Comparatif',

        // Stats dashboard
        stats_title:    'Statistiques de la base',
        stat_avg_pow:   'Puissance moyenne',
        stat_max_pow:   'Puissance max',
        stat_avg_acc:   '0-100 moyen (s)',
        stat_by_type:   'Répartition par catégorie',
        stat_by_energy: 'Répartition par motorisation',
        stat_top_pow:   '🏆 Top puissance',

        // Catégories
        cat_berline:    'Berline',
        cat_suv:        'SUV',
        cat_coupe:      'Coupé',
        cat_cabriolet:  'Cabriolet',
        cat_supercar:   'Supercar',
        cat_hypercar:   'Hypercar',
        cat_citadine:   'Citadine',
        cat_break:      'Break',
        cat_pickup:     'Pick-up',

        // Motorisations
        eng_essence:    'Essence',
        eng_diesel:     'Diesel',
        eng_elec:       'Électrique',
        eng_hybrid:     'Hybride',
        eng_phev:       'Hybride rechargeable',
    },

    en: {
        subtitle:       'Automotive database',
        import:         '⬆ Import JSON',
        export:         '⬇ Export JSON',
        add_vehicle:    'Add a vehicle',

        vehicles:       'vehicles',
        brands:         'brands',
        stats_btn:      'Statistics',
        favs_only:      'Favorites',

        search_placeholder: 'Search a model, a brand…',
        all_categories: 'All categories',
        all_engines:    'All engine types',

        results_one:    'result',
        results_many:   'results',

        modal_add_title:  'New vehicle',
        modal_edit_title: 'Edit vehicle',
        modal_sub:        'Fill in the model information',
        modal_add_btn:    'Add to database 🚀',
        modal_edit_btn:   'Save ✅',

        brand:          'Brand *',
        brand_ph:       'e.g. Ferrari',
        model:          'Model *',
        model_ph:       'e.g. 488 GTB',
        year:           'Year',
        country:        'Country of origin',
        country_ph:     'e.g. Italy',
        category:       'Category',
        engine_type:    'Engine type',
        select:         '— Select —',

        section_engine: '⚙️ Engine specs',
        power:          'Power (hp)',
        torque:         'Torque (Nm)',
        displacement:   'Displacement (cc)',
        cylinders:      'Cylinders',
        acceleration:   '0-60 mph (s)',
        top_speed:      'Top speed (km/h)',

        section_media:  '🖼️ Media',
        image_url:      'Background image URL',
        image_ph:       'https://... (.jpg/.png)',
        sound_url:      'Engine sound URL',
        sound_ph:       'https://... (.mp3)',

        section_desc:   '📝 Description',
        description:    'Model description',
        desc_ph:        'Model overview, history, highlights…',
        desc_fr:        '🇫🇷 Description (French)',
        desc_fr_ph:     'Model description in French…',
        desc_en:        '🇬🇧 Description (English)',
        desc_en_ph:     'Model description in English…',
        translate_btn:  '🌐 Auto-translate to English',
        translate_hint: 'MyMemory translates for free (1000/day)',
        translating:    '⏳ Translating…',
        translate_ok:   '✅ Translated!',
        translate_err:  '❌ Translation error — you can write the translation manually',
        translate_empty:'⚠ Please write a French description first',

        cancel:         'Cancel',
        edit:           '✏️ Edit',
        delete:         '🗑 Delete',
        close:          '✕ Close',

        specs_title:    'Technical specifications',
        no_specs:       'No technical data available.',
        perf_title:     'Performance',

        spec_power:       'Power',
        spec_torque:      'Torque',
        spec_displacement:'Displacement',
        spec_cylinders:   'Cylinders',
        spec_accel:       '0 to 100',
        spec_vmax:        'Top speed',
        spec_engine:      'Engine type',
        spec_year:        'Year',

        empty_title:    'No results',
        empty_text:     'Try different terms or add this vehicle!',

        import_success: '✅ Import successful',
        import_added:   'vehicle(s) added.',
        import_invalid: 'Invalid JSON file: the file must contain an array of vehicles.',
        import_error:   'Error reading the JSON file.',
        sound_error:    'Unable to play this audio file. Check the sound URL.',
        delete_confirm: 'Remove this vehicle from the database?',

        lang_switch:    '🌐 FR',

        // Comparator
        compare_label:  'Compare',
        compare_go:     '⚡ Compare',
        compare_clear:  'Clear',
        compare_title:  'Side-by-side comparison',

        // Stats dashboard
        stats_title:    'Database statistics',
        stat_avg_pow:   'Average power',
        stat_max_pow:   'Max power',
        stat_avg_acc:   'Avg 0-100 (s)',
        stat_by_type:   'By category',
        stat_by_energy: 'By engine type',
        stat_top_pow:   '🏆 Top power',

        // Categories
        cat_berline:    'Sedan',
        cat_suv:        'SUV',
        cat_coupe:      'Coupe',
        cat_cabriolet:  'Convertible',
        cat_supercar:   'Supercar',
        cat_hypercar:   'Hypercar',
        cat_citadine:   'City car',
        cat_break:      'Estate',
        cat_pickup:     'Pick-up',

        // Engine types
        eng_essence:    'Petrol',
        eng_diesel:     'Diesel',
        eng_elec:       'Electric',
        eng_hybrid:     'Hybrid',
        eng_phev:       'Plug-in hybrid',
    },
};


let currentLang = localStorage.getItem('autobase_lang') || 'fr';

function t(key) {
    return TRANSLATIONS[currentLang][key] || key;
}

function applyLang() {
    document.documentElement.lang = currentLang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    document.querySelectorAll('[data-i18n-opt]').forEach(el => {
        const key = el.getAttribute('data-i18n-opt');
        el.textContent = t(key);
    });

    const langBtn = document.getElementById('lang-btn');
    if (langBtn) langBtn.textContent = t('lang_switch');

    document.title = currentLang === 'fr'
        ? 'FullThrottle — Base de Données Automobile'
        : 'FullThrottle — Automotive Database';

    if (typeof renderCards === 'function') renderCards();

    if (typeof currentDetailId !== 'undefined' && currentDetailId !== null) {
        if (typeof openDetail === 'function') openDetail(currentDetailId);
    }
}

async function toggleLang() {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';
    localStorage.setItem('autobase_lang', currentLang);
    applyLang();

    if (currentLang === 'en' && typeof autoTranslateMissing === 'function') {
        await autoTranslateMissing();
    }
}

document.addEventListener('DOMContentLoaded', applyLang);