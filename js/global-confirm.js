// js/global-confirm.js

function showGlobalConfirm(message) {
  const modal = document.getElementById('globalConfirmModal');
  const messageEl = document.getElementById('globalConfirmMessage');
  const btnYes = document.getElementById('globalConfirmBtnYes');
  const btnNo = document.getElementById('globalConfirmBtnNo');

  if (!modal || !messageEl || !btnYes || !btnNo) {
    console.error("Global confirmation modal elements not found on this page.");
    return Promise.resolve(false);
  }

  messageEl.textContent = message;

  // FIX: Use a CSS class to show the modal, just like your other modals
  modal.classList.add('visible');

  return new Promise(resolve => {
    
    const onYesClick = () => {
      // FIX: Use a CSS class to hide the modal
      modal.classList.remove('visible');
      cleanup();
      resolve(true);
    };

    const onNoClick = () => {
      // FIX: Use a CSS class to hide the modal
      modal.classList.remove('visible');
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      btnYes.removeEventListener('click', onYesClick);
      btnNo.removeEventListener('click', onNoClick);
    };

    btnYes.addEventListener('click', onYesClick);
    btnNo.addEventListener('click', onNoClick);
  });
}