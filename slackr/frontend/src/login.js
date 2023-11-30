import { showAlert, showPage, apiCall } from "./helpers.js";
import { loadDashboard } from "./channel.js";
import { clearRegisterForm } from "./register.js";
localStorage.clear();

// sign in and jump to dashboard page if submit clicked
document.getElementById('login-submit').addEventListener('click', (e) => {
  e.preventDefault();
  const loginEmail = document.getElementById('login-email').value;
  const loginPassword = document.getElementById('login-password').value;
  apiCall('auth/login', 'POST', {
    email: loginEmail,
    password: loginPassword
  })
    .then(data => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      showPage('page-dashboard');
      loadDashboard();
      clearRegisterForm();
    })
    .catch(err => showAlert(err));
})