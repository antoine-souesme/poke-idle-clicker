# Spécifications Fonctionnelles — Extension Chrome : Poke-Idle Auto-Clicker

## 1. Vue d'ensemble

Extension Chrome à usage personnel permettant d'automatiser les interactions répétitives sur le jeu **Poke-Idle** (pension Pokémon). L'extension scrute périodiquement la page active et clique automatiquement sur deux boutons spécifiques dès qu'ils apparaissent, en suivant une séquence précise.

---

## 2. Fonctionnement général

### Séquence automatisée

La séquence se déroule en deux étapes enchaînées :

**Étape 1 — Bouton principal (page Pension)**
- L'extension détecte la présence du bouton `Récupérer X oeuf(s)` sur la page.
- Si le bouton est présent et visible, l'extension clique dessus automatiquement.
- Après le clic, l'extension attend l'apparition d'une modale.

**Étape 2 — Bouton de la modale (Éclosion)**
- Après le clic sur le bouton principal, une modale intitulée **"Éclosion !"** s'affiche.
- L'extension détecte la présence du bouton `Redéposer X` dans cette modale.
- Si le bouton est présent et visible, l'extension clique dessus automatiquement.
- La modale se ferme, la séquence repart depuis l'étape 1 au prochain intervalle.

### Boucle de vérification

- L'intervalle de vérification est configurable par l'utilisateur (valeur par défaut : **5 secondes**).
- La vérification se fait en continu tant que l'extension est **activée** sur l'onglet courant.
- Si aucun des deux boutons n'est présent lors d'une vérification, l'extension ne fait rien et attend le prochain cycle.

---

## 3. Identification des éléments DOM

### Bouton principal — "Récupérer X oeuf(s)"

- **Contexte** : page Pension Pokémon du jeu Poke-Idle.
- **Sélection recommandée** : bouton contenant le texte `Récupérer` et `oeuf` (insensible à la casse, car le nombre X est dynamique).
- **Stratégie de sélection** : `Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Récupérer') && btn.textContent.includes('oeuf'))` ou sélecteur CSS stable s'il existe.
- **État requis** : bouton présent dans le DOM **et** non désactivé (`disabled`).

### Bouton secondaire — "Redéposer X" (dans la modale)

- **Contexte** : modale "Éclosion !" qui s'affiche après récupération des œufs.
- **Sélection recommandée** : bouton contenant le texte `Redéposer` dans la modale visible.
- **Stratégie de sélection** : `Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Redéposer'))`.
- **État requis** : bouton présent dans le DOM **et** visible (la modale doit être ouverte).

---

## 4. Architecture de l'extension

```
poke-idle-clicker/
├── manifest.json          # Configuration de l'extension (Manifest V3)
├── background.js          # Service worker : gestion de l'état par onglet
├── content.js             # Script injecté dans la page : détection et clic
├── popup/
│   ├── popup.html         # Interface utilisateur du popup
│   ├── popup.js           # Logique du popup (activation, intervalle)
│   └── popup.css          # Styles du popup
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 5. Manifest V3 — `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "Poke-Idle Auto-Clicker",
  "version": "1.0.0",
  "description": "Clique automatiquement sur les boutons de la pension Poke-Idle.",
  "permissions": ["activeTab", "storage", "scripting"],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

> **Note** : `<all_urls>` est utilisé pour permettre l'activation sur n'importe quel onglet, mais l'extension ne s'active qu'explicitement via le popup pour l'onglet courant.

---

## 6. Composant `content.js` — Script de contenu

### Responsabilités
- Écouter les messages du `background.js` : `START`, `STOP`, `SET_INTERVAL`.
- Gérer la boucle de vérification (`setInterval` / `clearInterval`).
- Détecter et cliquer sur les boutons selon la séquence décrite.
- Envoyer des messages de retour au popup pour afficher des logs.

### Logique de détection et clic

```
function runCycle() {
  // Étape 1 : chercher le bouton principal
  const btnRecover = findRecoverButton()
  if (btnRecover) {
    btnRecover.click()
    log('Clic sur "Récupérer oeuf(s)"')
    // Attendre que la modale apparaisse (délai court : 500-1000ms)
    setTimeout(() => {
      // Étape 2 : chercher le bouton de redépôt dans la modale
      const btnRedeposit = findRedepositButton()
      if (btnRedeposit) {
        btnRedeposit.click()
        log('Clic sur "Redéposer"')
      }
    }, 800)
    return
  }

  // Si pas de bouton principal, vérifier quand même la modale (cas edge)
  const btnRedeposit = findRedepositButton()
  if (btnRedeposit) {
    btnRedeposit.click()
    log('Clic sur "Redéposer" (modale déjà ouverte)')
  }
}
```

### Messages entrants (depuis background/popup)

| Message | Action |
|---|---|
| `{ type: 'START', interval: N }` | Démarre la boucle avec un intervalle de N secondes |
| `{ type: 'STOP' }` | Arrête la boucle |
| `{ type: 'SET_INTERVAL', interval: N }` | Redémarre la boucle avec le nouvel intervalle |

### Messages sortants (vers popup)

| Message | Description |
|---|---|
| `{ type: 'LOG', message: '...' }` | Texte d'activité à afficher dans le popup |
| `{ type: 'STATUS', active: bool }` | Statut courant de la boucle |

---

## 7. Composant `background.js` — Service Worker

### Responsabilités
- Maintenir l'état `active` et `interval` **par onglet** (`tabId → { active, interval }`).
- Relayer les messages du popup vers le content script de l'onglet actif.
- Nettoyer l'état d'un onglet quand il est fermé.

### Structure de l'état

```js
// state : Map<tabId, { active: boolean, interval: number }>
const tabStates = {}
```

### Gestion des messages (depuis popup)

| Message reçu | Comportement |
|---|---|
| `{ type: 'TOGGLE', tabId, interval }` | Active ou désactive l'auto-clicker pour cet onglet |
| `{ type: 'GET_STATUS', tabId }` | Retourne `{ active, interval }` pour cet onglet |
| `{ type: 'SET_INTERVAL', tabId, interval }` | Met à jour l'intervalle pour cet onglet |

---

## 8. Composant `popup/` — Interface utilisateur

### Éléments UI

| Élément | Description |
|---|---|
| **Toggle ON/OFF** | Bouton pour activer/désactiver l'auto-clicker sur l'onglet courant |
| **Champ intervalle** | Input numérique (secondes) — valeur min : 1, max : 60, défaut : 5 |
| **Indicateur de statut** | Pastille colorée + texte "Actif" / "Inactif" |
| **Zone de logs** | Liste des 10 dernières actions effectuées (avec horodatage) |

### Comportement

- À l'ouverture du popup, interroger le background pour récupérer l'état courant de l'onglet actif.
- Le toggle reflète immédiatement l'état réel (actif/inactif).
- Modifier l'intervalle **pendant** l'exécution redémarre la boucle avec la nouvelle valeur.
- Les logs s'affichent en temps réel via `chrome.runtime.onMessage`.
- L'état est **persisté via `chrome.storage.local`** pour survivre à la fermeture du popup.

### Design

- Thème sombre cohérent avec l'univers Poke-Idle (fond `#1a1a2e`, accents pokémon rouge/jaune).
- Largeur fixe : 300px.
- Police : système (sans-serif).

---

## 9. Persistance de l'état

- Utiliser `chrome.storage.local` pour persister `{ active, interval }` par `tabId`.
- Au démarrage du service worker (après un éventuel crash/reload), restaurer l'état précédent pour les onglets encore ouverts.
- À la fermeture d'un onglet (`chrome.tabs.onRemoved`), supprimer son entrée dans le storage.

---

## 10. Gestion des erreurs et cas limites

| Cas | Comportement attendu |
|---|---|
| La page n'est pas Poke-Idle | L'extension s'active quand même mais ne trouve aucun bouton → aucun clic, log "Aucun bouton détecté" |
| Le bouton est désactivé (`disabled`) | Ne pas cliquer, attendre le prochain cycle |
| La modale ne s'ouvre pas après le clic principal | Le timeout expire silencieusement, la prochaine itération reprend normalement |
| L'onglet est rechargé | Le content script se réinitialise ; le background reprend l'état persisté et envoie `START` si nécessaire |
| Le service worker est tué par Chrome | L'état est récupéré depuis `chrome.storage.local` au prochain réveil |

---

## 11. Contraintes techniques

- **Manifest V3** obligatoire (standard actuel Chrome).
- **Aucune dépendance externe** : vanilla JavaScript uniquement, aucun bundler requis.
- **Permissions minimales** : `activeTab`, `storage`, `scripting` — pas de permission `tabs` large.
- **Pas de serveur distant** : tout fonctionne en local.
- L'extension ne doit **pas** interférer avec d'autres onglets que celui où elle est explicitement activée.

---

## 12. Livrables attendus

1. `manifest.json`
2. `background.js`
3. `content.js`
4. `popup/popup.html`
5. `popup/popup.js`
6. `popup/popup.css`
7. `icons/icon16.png`, `icon48.png`, `icon128.png` (placeholders PNG simples acceptés)
