import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, closeAlert, showPage, showAlert } from './helpers.js';
import { clearRegisterForm } from './register.js';
import { showUserProfileModal } from './user.js';
import { showChannelMessages } from './message.js';
import { loadDashboard } from './channel.js';

import('./channel.js');
import('./config.js');
import('./login.js');
import('./logout.js');
import('./register.js');
import('./message.js');
import('./user.js')
// import('./notification.js');
let globalToken = null;
localStorage.setItem('defaultImgSrc', '../styles/defaultImg.jpg');

// enable the redirect for all buttons with .redirect class
for (const redirect of document.querySelectorAll('.redirect')) {
	const newPage = redirect.getAttribute('redirect');
	redirect.addEventListener('click', () => {
    clearRegisterForm();
		showPage(newPage);
    closeAlert();
	});
}

// if there is no token, show login, otherwise show dashboard
if (!globalToken) {
  showPage('page-login');
} else {
  showPage('page-dashboard');
}

// jump to page if hash changed
window.addEventListener('hashchange', () => {
  const fragment = window.location.hash;
  if (fragment === '#profile') {
    document.getElementById('profile-button').click();
  } else if (fragment.startsWith('#profile')) {
    const userId = fragment.substring(9);
    showUserProfileModal(userId);
  } else if (fragment.startsWith('#channel=')) {
    const channelId = fragment.substring(9);
    showChannelMessages(channelId);
  } else {
    showAlert('Path does not exist');
    loadDashboard();
  }
})