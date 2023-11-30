import { showPage, showAlert, apiCall, removeChilds } from "./helpers.js";
import { interval } from "./notification.js";

// jump back to signin page and hide all the uneccessary elements
const logoutButton = document.getElementById('logout-button');
logoutButton.addEventListener('click', () => {
  apiCall('auth/logout', 'POST', {}, true)
    .then(() => {
      clearInterval(interval);
      localStorage.clear();
      logoutButton.style.display = 'none';
      removeChilds(document.getElementById('message-screen'));
      document.getElementsByClassName('message-header')[0].style.display = 'none';
      showPage('page-login');
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';
      // hide all elements with class .user
      for (const element of document.querySelectorAll('.user')) {
        element.style.display = 'none';
      }
    })
    .catch(err => showAlert(err));
})