import { apiCall, showAlert, removeChilds, closeModal } from "./helpers.js";
import { getChannelInfo } from "./channel.js";

let invitedUserIdList = [];
// get user information api
export const getUserInfo = (userId) => {
  return apiCall(`user/${userId}`, 'GET', '', true);
}
// get all user list api
const getAllUsers = () => {
  return apiCall(`user`, 'GET', '', true);
}
// close the invite user modal
document.getElementById('invite-usr-close-btn').addEventListener('click', () => {
  closeModal();
  invitedUserIdList = [];
  removeChilds(document.getElementById('invite-usr-modal-body'));
})

// show user invite modal list if clicked
document.getElementById('invite-usr-btn').addEventListener('click', () => {
  const inviteUserBody = document.getElementById('invite-usr-modal-body');
  removeChilds(inviteUserBody);
  let inviteModal = document.getElementById('invite-usr-modal');
  inviteModal.style.display = 'flex';
  // check which user that is not a member can be invited
  getAllUsers()
    .then(allUsers => {
      getChannelInfo(localStorage.getItem('channelId'))
        .then(channelInfo => {
          for (const user of allUsers.users) {
            if (!channelInfo.members.includes(user.id)) {
              invitedUserIdList.push(user.id);
            }
          }
          invitedUserIdList.sort();
          // display the user name if the user can be invited
          for (const userId of invitedUserIdList) {
            getUserInfo(userId)
              .then(userInfo => {
                let checkUser = document.getElementsByClassName('invite-form')[0].cloneNode(true);
                checkUser.getElementsByClassName('form-check-label')[0].textContent = userInfo.name;
                checkUser.style.display = 'block';
                inviteUserBody.appendChild(checkUser);
              });
          }
        })
        .catch(showAlert);
    })
    .catch(showAlert);
})

// invite user api
const submitInviteUser = (userId) => {
  return apiCall(`channel/${localStorage.getItem('channelId')}/invite`, 'POST', {
    userId: userId
  }, true);
}

// submit the invited users if clicked
document.getElementById('invite-usr-submit-btn').addEventListener('click', () => {
  let promiseList = [];
  // for each selected users, submit the invitation
  for (const index in invitedUserIdList) {
    if (document.getElementById('invite-usr-modal-body').children[index].getElementsByClassName('form-check-input')[0].checked) {
      const checkUser = invitedUserIdList[index];
      const submitPromise = submitInviteUser(checkUser);
      submitPromise
        .catch(showAlert);
      promiseList.push(submitPromise);
    }
  }
  // close the modal untill all the users are invited
  const allPromise = Promise.all(promiseList);
  allPromise.then(() => {
    removeChilds(document.getElementById('invite-usr-modal-body'));
    closeModal();
    invitedUserIdList = [];
  })
})
// close the user profile if clicked
document.getElementById('user-profile-close-btn').addEventListener('click', () => {
  document.getElementById('user-profile-modal').style.display = 'none';
  closeModal();
})
// close the other user's profile if clicked
document.getElementById('profile-close-btn').addEventListener('click', () => {
  document.getElementById('profile-modal').style.display = 'none';
  closeModal();
})
// show the other user profile's modal
export const showUserProfileModal = (userId) => {
  document.getElementById('user-profile-modal').style.display = 'flex';
  getUserInfo(userId)
    .then(userInfo => {
      document.getElementById('user-profile-image').src = userInfo.image ? userInfo.image : localStorage.getItem('defaultImgSrc');
      document.getElementById('user-profile-name').textContent = `User Name: ${userInfo.name}`;
      document.getElementById('user-profile-email').textContent = `User Email: ${userInfo.email}`;
      document.getElementById('user-profile-bio').textContent = `User Bio: ${userInfo.bio}`
    })
    .catch(showAlert);
}

let passwordInput = document.getElementById('profile-password'); 
// show/hide password checkbox toggle
document.getElementById('show-profile-password').addEventListener('click', () => {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
  } else {
    passwordInput.type = 'password';
  }
})

let originalEmail = '';
let originalProfileImage = '';
let profileBody = {};
// show the profile information if clicked
document.getElementById('profile-button').addEventListener('click', () => {
  document.getElementById('profile-modal').style.display = 'flex';
  getUserInfo(localStorage.getItem('userId'))
    .then(userInfo => {
      originalEmail = userInfo.email;
      originalProfileImage = userInfo.image;
      document.getElementById('profile-name').value = userInfo.name;
      document.getElementById('profile-bio').value = userInfo.name;
      document.getElementById('edit-profile-image').value = '';
      document.getElementById('profile-email').value = userInfo.email;
      document.getElementById('profile-password').value = '';
    })
})
// update user profile api
const updateUserProfile = (profileBody) => {
  return apiCall('user', 'PUT', profileBody, true);
}
// update the user profile information if clicked
document.getElementById('profile-submit-btn').addEventListener('click', () => {
  const email = document.getElementById('profile-email').value;
  if (originalEmail !== email) {
    profileBody.emal = email;
  }
  // get the new password if user check the checkbox
  if (document.getElementById('check-change-password').checked) {
    profileBody.password = document.getElementById('profile-password').value;
  }
  // get the new image source if user check the checkbox
  if (document.getElementById('edit-profile-image').value !== originalProfileImage) {
    profileBody.image = document.getElementById('edit-profile-image').value;
    
  }
  profileBody.name = document.getElementById('profile-name').value;
  profileBody.bio = document.getElementById('profile-bio').value;
  updateUserProfile(profileBody)
    .then(() => {
      closeModal();
    })
    .catch(showAlert);
})