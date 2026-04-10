let intervalId = null;

function findRecoverButton() {
  return Array.from(document.querySelectorAll('button')).find(
    (btn) =>
      !btn.disabled &&
      btn.textContent.includes('Récupérer')
  ) || null;
}

function findRedepositButton() {
  return Array.from(document.querySelectorAll('button')).find(
    (btn) => !btn.disabled && btn.textContent.includes('Redéposer')
  ) || null;
}

function findOkButton() {
  return Array.from(document.querySelectorAll('button')).find(
    (btn) => !btn.disabled && btn.textContent.trim() === 'OK'
  ) || null;
}

function sendLog(message) {
  chrome.runtime.sendMessage({ type: 'LOG', message }).catch(() => {});
}

function runCycle() {
  // Étape 1 : chercher le bouton principal
  const btnRecover = findRecoverButton();
  if (btnRecover) {
    btnRecover.click();
    sendLog('Clic sur "Récupérer oeuf(s)"');

    // Attendre que la modale apparaisse
    setTimeout(() => {
      const btnRedeposit = findRedepositButton();
      if (btnRedeposit) {
        btnRedeposit.click();
        sendLog('Clic sur "Redéposer"');
      }
    }, 800);
    return;
  }

  // Cas edge : modale déjà ouverte sans avoir cliqué sur le bouton principal
  const btnRedeposit = findRedepositButton();
  if (btnRedeposit) {
    btnRedeposit.click();
    sendLog('Clic sur "Redéposer" (modale déjà ouverte)');
    return;
  }

  sendLog('Aucun bouton détecté');
}

function startLoop(intervalSeconds) {
  stopLoop();
  runCycle();
  intervalId = setInterval(runCycle, intervalSeconds * 1000);
  chrome.runtime.sendMessage({ type: 'STATUS', active: true }).catch(() => {});
}

function stopLoop() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  chrome.runtime.sendMessage({ type: 'STATUS', active: false }).catch(() => {});
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'START') {
    startLoop(message.interval || 5);
  } else if (message.type === 'STOP') {
    stopLoop();
  } else if (message.type === 'SET_INTERVAL') {
    if (intervalId !== null) {
      startLoop(message.interval || 5);
    }
  }
});
