import { showAlert, showPage, apiCall } from "./helpers.js";
import { loadDashboard } from "./channel.js";

// clear the value of all inputs in register form
export const clearRegisterForm = () => {
  for (const element of document.getElementsByClassName('register-input')) {
    element.value = '';
  }
}
// register user if clicked
document.getElementById('register-submit').addEventListener('click', (e) => {
  e.preventDefault();
  // get inputs from user
  const registerEmail = document.getElementById('register-email').value;
  const registerName = document.getElementById('register-name').value;
  const registerPassword = document.getElementById('register-password').value;
  const registerPasswordConfirm = document.getElementById('register-password-confirm').value;
  // check if password matches
  if (registerPassword !== registerPasswordConfirm) {
    showAlert("Passwords need to match");
    clearRegisterForm();
  } else {
    apiCall('auth/register', 'POST', {
      email: registerEmail,
      name: registerName,
      password: registerPassword,
    })
      // store information to localstorage and load dashboard
      .then(data => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        showPage('page-dashboard');
        clearRegisterForm();
        loadDashboard();
      })
      .catch((err) => showAlert(err));
  }
});