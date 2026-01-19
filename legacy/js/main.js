
// main.js
// Main entry point - ties everything together

import { initAuth, handleLogout, handleChangePassword } from './auth.js';
import { initTheme } from './theme.js';
import { loadNotifications, setupNotificationForm, deleteNotification } from './notifications.js';
import { loadTutorials, openTutorialEditor, saveTutorial, editTutorial, deleteTutorial } from './tutorials.js';
import { addSlide, removeSlide, moveSlide, handleSlideImage } from './slides.js';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Auth Flow -> Load Data
  initAuth(() => {
    loadNotifications();
    loadTutorials();
  });
  
  // Setup Event Listeners
  handleLogout();
  handleChangePassword();
  setupNotificationForm();
});

// EXPORT TO WINDOW (for HTML onclick handlers)
// We use underscore prefix in some HTML calls or update HTML to match
// For minimal HTML changes, we map specific names expected by the UI
window.openTutorialEditor = openTutorialEditor;
window.saveTutorial = saveTutorial;
window.addSlide = addSlide;

// These were used in string templates or onclicks
window._deleteNotification = deleteNotification; // updated in notifications.js template
window._editTutorial = editTutorial; // updated in tutorial.js template
window._deleteTutorial = deleteTutorial; // updated in tutorial.js template
window._moveSlide = moveSlide; // updated in slides.js template
window._removeSlide = removeSlide; // updated in slides.js template
window._handleSlideImage = handleSlideImage; // updated in slides.js template

// Also map original names if any HTML is missed (backward compatibility)
window.editTutorial = editTutorial;
window.deleteTutorial = deleteTutorial;
window.moveSlide = moveSlide;
window.removeSlide = removeSlide;
window.handleSlideImage = handleSlideImage;
window.deleteNotification = deleteNotification;
