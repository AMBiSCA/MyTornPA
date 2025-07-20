// js/global-confirm.js

function showGlobalConfirm(message) {
  // Find the modal elements on the page
  const modal = document.getElementById('globalConfirmModal');
  const messageEl = document.getElementById('globalConfirmMessage');
  const btnYes = document.getElementById('globalConfirmBtnYes');
  const btnNo = document.getElementById('globalConfirmBtnNo');

  // If the modal doesn't exist on the page, exit gracefully
  if (!modal || !messageEl || !btnYes || !btnNo) {
    console.error("Global confirmation modal elements not found on this page.");
    return Promise.resolve(false); // Assume "No" if the modal is missing
  }

  // Set the custom message
  messageEl.textContent = message;

  // Show the modal
  modal.style.display = 'flex';

  // This returns a "Promise", which is like an IOU.
  // It will eventually give us a value (true or false) based on what the user clicks.
  return new Promise(resolve => {
    
    // Create one-time click handlers
    const onYesClick = () => {
      modal.style.display = 'none'; // Hide modal
      cleanup();
      resolve(true); // User clicked "OK"
    };

    const onNoClick = () => {
      modal.style.display = 'none'; // Hide modal
      cleanup();
      resolve(false); // User clicked "Cancel"
    };

    // This function removes the event listeners so they don't stack up
    const cleanup = () => {
      btnYes.removeEventListener('click', onYesClick);
      btnNo.removeEventListener('click', onNoClick);
    };

    // Attach the listeners
    btnYes.addEventListener('click', onYesClick);
    btnNo.addEventListener('click', onNoClick);
  });
}