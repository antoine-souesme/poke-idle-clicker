const toggleBtn = document.getElementById('toggle-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const intervalInput = document.getElementById('interval-input');
const logsList = document.getElementById('logs-list');

const MAX_LOGS = 10;

let currentTabId = null;
let isActive = false;

function formatTime(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function addLog(message) {
  const li = document.createElement('li');
  const time = document.createElement('span');
  time.className = 'time';
  time.textContent = formatTime(new Date());
  li.appendChild(time);
  li.appendChild(document.createTextNode(message));
  logsList.prepend(li);

  // Garder seulement les 10 derniers logs
  while (logsList.children.length > MAX_LOGS) {
    logsList.removeChild(logsList.lastChild);
  }
}

function setStatus(active) {
  isActive = active;
  statusDot.className = `dot ${active ? 'active' : 'inactive'}`;
  statusText.textContent = active ? 'Actif' : 'Inactif';
  toggleBtn.textContent = active ? 'Désactiver' : 'Activer';
  toggleBtn.className = `btn-toggle ${active ? 'active' : ''}`;
}

// Initialisation : récupérer l'état courant
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  currentTabId = tabs[0].id;

  chrome.runtime.sendMessage({ type: 'GET_STATUS', tabId: currentTabId }, (response) => {
    if (chrome.runtime.lastError || !response) return;
    setStatus(response.active);
    intervalInput.value = response.interval || 5;
  });
});

// Toggle ON/OFF
toggleBtn.addEventListener('click', () => {
  if (!currentTabId) return;
  const interval = parseInt(intervalInput.value, 10) || 5;
  chrome.runtime.sendMessage(
    { type: 'TOGGLE', tabId: currentTabId, interval },
    (response) => {
      if (chrome.runtime.lastError || !response) return;
      setStatus(response.active);
      addLog(response.active ? 'Auto-clicker démarré' : 'Auto-clicker arrêté');
    }
  );
});

// Changement d'intervalle
intervalInput.addEventListener('change', () => {
  if (!currentTabId) return;
  let interval = parseInt(intervalInput.value, 10);
  if (isNaN(interval) || interval < 1) interval = 1;
  if (interval > 60) interval = 60;
  intervalInput.value = interval;

  chrome.runtime.sendMessage({ type: 'SET_INTERVAL', tabId: currentTabId, interval }, () => {
    if (chrome.runtime.lastError) return;
    if (isActive) addLog(`Intervalle mis à jour : ${interval}s`);
  });
});

// Recevoir les logs et statuts du content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'LOG') {
    addLog(message.message);
  } else if (message.type === 'STATUS') {
    setStatus(message.active);
  }
});
