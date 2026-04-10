# Instructions d'installation — Poke-Idle Auto-Clicker

## Prérequis

- Google Chrome (ou Chromium) version 88 ou supérieure
- Accès aux paramètres développeur de Chrome

---

## Étape 1 — Récupérer les fichiers

Une fois que Claude Code a généré l'extension, tu dois avoir un dossier `poke-idle-clicker/` avec la structure suivante :

```
poke-idle-clicker/
├── manifest.json
├── background.js
├── content.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Étape 2 — Charger l'extension en mode développeur

1. Ouvre Chrome et va à l'adresse : `chrome://extensions/`

2. En haut à droite, active le **Mode développeur** (toggle).

3. Clique sur **"Charger l'extension non empaquetée"** (Load unpacked).

4. Sélectionne le dossier `poke-idle-clicker/` (le dossier racine contenant `manifest.json`).

5. L'extension apparaît dans la liste avec le nom **"Poke-Idle Auto-Clicker"**.

---

## Étape 3 — Épingler l'extension (recommandé)

1. Clique sur l'icône puzzle 🧩 dans la barre d'outils Chrome.
2. Repère **"Poke-Idle Auto-Clicker"** dans la liste.
3. Clique sur l'icône 📌 pour l'épingler dans la barre.

L'icône de l'extension est maintenant accessible directement depuis la barre d'outils.

---

## Étape 4 — Utiliser l'extension

1. Ouvre l'onglet avec le jeu **Poke-Idle** et navigue sur la page **Pension**.

2. Clique sur l'icône de l'extension dans la barre d'outils pour ouvrir le popup.

3. Dans le popup :
   - Règle l'**intervalle** (en secondes) selon tes préférences (défaut : 5 secondes).
   - Clique sur le bouton **ON** pour activer l'auto-clicker sur cet onglet.

4. L'indicateur passe à **"Actif"** et l'extension commence à surveiller la page.

5. Pour arrêter, rouvre le popup et clique sur **OFF**.

---

## Étape 5 — Vérifier que ça fonctionne

- Ouvre le popup : la zone de logs doit afficher les actions effectuées avec horodatage.
- Attends qu'un bouton "Récupérer X oeuf(s)" apparaisse sur la page : il doit être cliqué automatiquement.
- La modale "Éclosion !" doit ensuite s'afficher et le bouton "Redéposer" doit être cliqué automatiquement.

---

## Mise à jour de l'extension

Si Claude Code génère une nouvelle version des fichiers :

1. Remplace les fichiers modifiés dans le dossier `poke-idle-clicker/`.
2. Va sur `chrome://extensions/`.
3. Clique sur l'icône **🔄** (rafraîchir) sur la carte de l'extension.

Pas besoin de recharger l'extension depuis zéro.

---

## Désinstallation

1. Va sur `chrome://extensions/`.
2. Clique sur **"Supprimer"** sur la carte de l'extension.

---

## Résolution des problèmes courants

| Problème | Solution |
|---|---|
| L'extension n'apparaît pas dans la liste | Vérifie que tu as sélectionné le bon dossier (celui qui contient `manifest.json` directement) |
| Le popup s'ouvre mais rien ne se passe | Assure-toi d'être sur la bonne page et que l'extension est bien activée (statut "Actif") |
| Erreur dans `chrome://extensions/` | Clique sur "Détails" > "Erreurs" pour voir le message d'erreur précis |
| L'extension se désactive après un rechargement de page | Comportement normal en mode dev si le service worker est tué — réactive depuis le popup |
| Les boutons ne sont pas cliqués | Ouvre la console (F12) sur la page du jeu et vérifie les logs du content script |

---

## Déboguer l'extension

**Logs du content script** (ce qui se passe sur la page) :
- F12 sur la page Poke-Idle → onglet **Console**

**Logs du service worker** (background) :
- `chrome://extensions/` → clic sur "Inspecter les vues : service worker"

**Logs du popup** :
- Clic droit sur l'icône de l'extension → "Inspecter l'élément du popup"
