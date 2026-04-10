// state : Map<tabId, { active: boolean, interval: number }>
const tabStates = {};

// Restaurer l'état depuis chrome.storage.local au démarrage
chrome.storage.local.get(null, (data) => {
  for (const key of Object.keys(data)) {
    if (key.startsWith('tab_')) {
      const tabId = parseInt(key.replace('tab_', ''), 10);
      tabStates[tabId] = data[key];

      // Vérifier si l'onglet existe encore et relancer si nécessaire
      if (tabStates[tabId].active) {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError || !tab) {
            delete tabStates[tabId];
            chrome.storage.local.remove(key);
            return;
          }
          chrome.tabs.sendMessage(tabId, {
            type: 'START',
            interval: tabStates[tabId].interval,
          }).catch(() => {});
        });
      }
    }
  }
});

// Nettoyer l'état d'un onglet à sa fermeture
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabStates[tabId];
  chrome.storage.local.remove(`tab_${tabId}`);
});

// Gestion des messages depuis le popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, tabId, interval } = message;

  if (type === 'GET_STATUS') {
    const state = tabStates[tabId] || { active: false, interval: 5 };
    sendResponse(state);
    return true;
  }

  if (type === 'TOGGLE') {
    const current = tabStates[tabId] || { active: false, interval: interval || 5 };
    const newActive = !current.active;
    const newState = { active: newActive, interval: interval || current.interval };
    tabStates[tabId] = newState;
    chrome.storage.local.set({ [`tab_${tabId}`]: newState });

    const msgType = newActive ? 'START' : 'STOP';
    chrome.tabs.sendMessage(tabId, { type: msgType, interval: newState.interval })
      .then(() => sendResponse({ success: true, active: newActive }))
      .catch(() => sendResponse({ success: false, active: newActive }));
    return true;
  }

  if (type === 'SET_INTERVAL') {
    const current = tabStates[tabId] || { active: false, interval: 5 };
    const newState = { ...current, interval };
    tabStates[tabId] = newState;
    chrome.storage.local.set({ [`tab_${tabId}`]: newState });

    if (newState.active) {
      chrome.tabs.sendMessage(tabId, { type: 'SET_INTERVAL', interval })
        .catch(() => {});
    }
    sendResponse({ success: true });
    return true;
  }
});
