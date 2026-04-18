// ============================================================
//   translate.js — Traduction automatique via MyMemory API
//
//   MyMemory est une API de traduction gratuite :
//   - Aucune inscription requise
//   - Aucune clé API requise
//   - 1000 requêtes gratuites par jour
//   - Fonctionne directement depuis le navigateur (pas de CORS)
//   - URL : https://api.mymemory.translated.net
//
//   Fonctionnement :
//   1. L'utilisateur écrit la description en français
//   2. Il clique sur "🌐 Traduire automatiquement"
//   3. fetch() envoie le texte à MyMemory
//   4. MyMemory retourne la traduction FR → EN
//   5. Le champ "Description (English)" est rempli automatiquement
//
//   Ordre de chargement dans index.html :
//     <script src="translate.js"></script>  ← avant cars.js
// ============================================================


// ============================================================
//   CONFIGURATION
//
//   L'API MyMemory s'appelle avec une simple requête GET :
//   https://api.mymemory.translated.net/get?q=TEXTE&langpair=fr|en
//
//   Pas besoin de clé API pour 1000 requêtes/jour.
//   Si tu ajoutes ton email en paramètre, tu passes à 10 000/jour :
//   &de=ton@email.com
// ============================================================

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';


// ============================================================
//   translateDescription()
//   Appelée par le bouton "🌐 Traduire" dans le formulaire.
//
//   Étapes :
//   1. Récupère le texte FR du textarea
//   2. Valide que ce n'est pas vide
//   3. Met le bouton en état "chargement"
//   4. Appelle MyMemory via fetch() GET
//   5. Insère la traduction dans le textarea EN
//   6. Remet le bouton en état normal
// ============================================================

async function translateDescription() {
    const frTextarea = document.getElementById('f-description-fr');
    const enTextarea = document.getElementById('f-description-en');
    const btn        = document.getElementById('btn-translate');
    const btnLabel   = document.getElementById('translate-label');

    const textFr = frTextarea.value.trim();

    // Validation : refus si le champ FR est vide
    if (!textFr) {
        showTranslateStatus('empty');
        frTextarea.style.borderColor = '#ff6b6b';
        setTimeout(() => { frTextarea.style.borderColor = ''; }, 2000);
        return;
    }

    // ---- État "chargement" ----
    // Désactive le bouton pendant la requête pour éviter les doubles appels
    btn.disabled        = true;
    btn.style.opacity   = '0.6';
    btn.style.cursor    = 'not-allowed';
    btnLabel.textContent = t('translating');
    document.getElementById('translate-icon').textContent = '⏳';

    try {
        // ----------------------------------------------------------------
        //   APPEL API MYMEMORY
        //
        //   MyMemory utilise une requête GET simple.
        //   On passe le texte et la paire de langues en paramètres URL.
        //
        //   URLSearchParams construit proprement les paramètres GET :
        //   il encode automatiquement les caractères spéciaux
        //   (accents, espaces → %20, etc.)
        //
        //   Paramètres :
        //     q        = le texte à traduire
        //     langpair = "fr|en" (français vers anglais)
        // ----------------------------------------------------------------

        const params = new URLSearchParams({
            q:        textFr,
            langpair: 'fr|en',
            // Décommente la ligne suivante et mets ton email pour 10 000 req/jour :
             de: 'cristianolecrack@gmail.com',
        });

        // fetch() GET — l'URL contient tous les paramètres
        const response = await fetch(`${MYMEMORY_URL}?${params}`);

        // Vérification du statut HTTP
        if (!response.ok) {
            throw new Error(`Erreur réseau : ${response.status}`);
        }

        // Parsing de la réponse JSON
        const data = await response.json();

        // ----------------------------------------------------------------
        //   STRUCTURE DE LA RÉPONSE MYMEMORY
        //
        //   {
        //     responseStatus: 200,          ← 200 = OK, 429 = limite atteinte
        //     responseData: {
        //       translatedText: "...",      ← le texte traduit
        //       match: 0.85                 ← score de confiance (0 à 1)
        //     }
        //   }
        // ----------------------------------------------------------------

        // Vérification du statut dans le corps de la réponse
        // (MyMemory retourne toujours HTTP 200 mais peut mettre 429 dans le body)
        if (data.responseStatus !== 200) {
            if (data.responseStatus === 429) {
                throw new Error('Limite journalière atteinte (1000 traductions/jour)');
            }
            throw new Error(`Erreur MyMemory : ${data.responseStatus}`);
        }

        const translatedText = data.responseData?.translatedText?.trim();

        if (!translatedText) {
            throw new Error('Réponse vide');
        }

        // ---- Succès : on remplit le textarea EN ----
        enTextarea.value = translatedText;

        // Feedback visuel : bordure verte temporaire
        enTextarea.style.borderColor = '#4ade80';
        setTimeout(() => { enTextarea.style.borderColor = ''; }, 2000);

        showTranslateStatus('ok');

    } catch (error) {
        console.error('Erreur traduction :', error);
        showTranslateStatus('error');

        // Affiche le message d'erreur technique dans la console pour le debug
        console.error('Détail :', error.message);

    } finally {
        // "finally" s'exécute TOUJOURS, que la requête ait réussi ou échoué.
        // C'est ici qu'on remet le bouton en état normal.
        btn.disabled      = false;
        btn.style.opacity = '1';
        btn.style.cursor  = 'pointer';
        btnLabel.textContent = t('translate_btn');
        document.getElementById('translate-icon').textContent = '🌐';
    }
}


// ============================================================
//   showTranslateStatus()
//   Affiche un message de statut sous le bouton de traduction.
//
//   status : 'ok' | 'error' | 'empty'
// ============================================================

function showTranslateStatus(status) {
    const hint = document.querySelector('.translate-hint');
    if (!hint) return;

    const messages = {
        ok:    { key: 'translate_ok',    color: '#4ade80' }, // vert
        error: { key: 'translate_err',   color: '#ff6b6b' }, // rouge
        empty: { key: 'translate_empty', color: '#fbbf24' }, // jaune
    };

    const { key, color } = messages[status] || messages.error;

    hint.textContent = t(key);
    hint.style.color = color;

    // Après 4 secondes, remet le message d'aide par défaut
    setTimeout(() => {
        hint.textContent = t('translate_hint');
        hint.style.color = '';
    }, 4000);
}


// ============================================================
//   translateText() — Traduit un texte FR→EN via MyMemory
//
//   Version "silencieuse" utilisée en arrière-plan par
//   autoTranslateMissing(). Pas de feedback bouton ici,
//   juste la requête et la valeur retournée.
//
//   Retourne : Promise<string> — le texte traduit
//   Lance    : Error si la requête échoue
// ============================================================

async function translateText(textFr) {
    const params = new URLSearchParams({ q: textFr, langpair: 'fr|en' });
    const response = await fetch(`${MYMEMORY_URL}?${params}`);

    if (!response.ok) throw new Error(`Erreur réseau : ${response.status}`);

    const data = await response.json();

    if (data.responseStatus !== 200) {
        throw new Error(`MyMemory erreur : ${data.responseStatus}`);
    }

    return data.responseData.translatedText.trim();
}


// ============================================================
//   autoTranslateMissing()
//   Appelée automatiquement par toggleLang() quand on passe en EN.
//
//   Parcourt toutes les voitures du tableau "cars" (défini dans cars.js).
//   Pour chacune qui n'a pas de description_en :
//     1. Traduit description_fr via MyMemory
//     2. Met à jour l'objet en mémoire
//     3. Sauvegarde via l'API backend (PUT /api/cars/:id)
//     4. Met à jour le cache localStorage
//     5. Re-rend les cartes pour afficher les nouvelles descriptions
//
//   Les requêtes sont faites en séquence (pas en parallèle) pour
//   ne pas dépasser la limite de l'API MyMemory.
// ============================================================

async function autoTranslateMissing() {
    // "cars" est le tableau global défini dans cars.js
    if (typeof cars === 'undefined' || cars.length === 0) return;

    // On filtre uniquement les voitures sans description_en
    const toTranslate = cars.filter(car =>
        !car.description_en && (car.description_fr || car.description)
    );

    if (toTranslate.length === 0) return; // Tout est déjà traduit

    // Affiche un statut discret en bas de l'écran
    if (typeof showStatus === 'function') {
        showStatus(`🌐 Traduction de ${toTranslate.length} description(s)…`, 'info');
    }

    let translated = 0;

    for (const car of toTranslate) {
        try {
            const textFr = car.description_fr || car.description || '';
            if (!textFr) continue;

            // Appel MyMemory pour cette voiture
            const textEn = await translateText(textFr);

            // Mise à jour de l'objet en mémoire
            car.description_en = textEn;

            // Sauvegarde permanente sur le backend (PUT /api/cars/:id)
            // updateCar est défini dans api.js
            if (typeof updateCar === 'function') {
                await updateCar(car.id, car);
            }

            translated++;

        } catch (error) {
            // En cas d'erreur sur une voiture, on continue avec les suivantes
            // (ne pas bloquer toute la boucle pour une erreur isolée)
            console.warn(`Traduction échouée pour ${car.marque} ${car.modele} :`, error.message);
        }
    }

    // Une fois toutes les traductions faites :
    // - Sauvegarde le cache localStorage avec les nouvelles données
    // - Re-rend les cartes pour afficher les descriptions EN
    if (translated > 0) {
        if (typeof saveCache === 'function') saveCache();
        if (typeof renderCards === 'function') renderCards();

        if (typeof showStatus === 'function') {
            showStatus(`✅ ${translated} description(s) traduite(s)`, 'success');
        }
    }
}