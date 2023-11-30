import { removeChilds, showAlert, apiCall, closeAlert, hideElements, closeModal, ISOtoDate } from "./helpers.js";
import { getUserInfo } from "./user.js";
import { showChannelMessages } from "./message.js";
import { updateJoinedChannelMsgList, pollNotificatoin } from "./notification.js";

// Sidebar click to show
let sidebar = document.getElementById('sidebar');
let sidebarBtn = document.getElementById('sidebar-btn');
sidebarBtn.addEventListener('click', () => {
  if (sidebar.style.display === 'none' || sidebar.style.display === '') {
    sidebar.style.display = 'flex';
    sidebar.style.width = '250px';
  } else {
    sidebar.style.display = 'none';
    sidebar.style.width = '0';
  }
})

// Sidebar close button
document.getElementById('close-nav').addEventListener('click', () => {
  sidebar.style.display = 'none';
  sidebar.style.width = '0';
})

// Load the whole dashboard
export const loadDashboard = () => {
  closeAlert();
  hideElements();
  localStorage.setItem('start', 0);
  localStorage.setItem('defaultImgSrc', '../styles/defaultImg.jpg');
  document.getElementById('logout-button').style.display = 'block';
  document.getElementById('page-dashboard').style.display = 'flex';
  document.getElementById('sidebar-btn').style.display = 'flex';
  for (const element of document.querySelectorAll('.user')) {
    element.style.display = 'flex';
  }
  localStorage.setItem('joinedChannelMsgList', JSON.stringify({}));
  updateJoinedChannelMsgList();
  pollNotificatoin();
  showChannelListIfPrivate(false);
};

// call get the channel information api
export const getChannelInfo = (channelId) => {
  return apiCall(`channel/${channelId}`, 'GET', {}, true);
}

// get the private and public channel from the given list
const getBothChannelLists = (channelList) => {
  let privateChannelList = [];
  let publicChannelList = [];
  for (const channel of channelList) {
    // check if the channel is private and also if the user is in the channel
    if (channel.private === true && channel.members.includes(parseInt(localStorage.getItem('userId')))) {
      privateChannelList.push(channel);
    }
    else if (channel.private === false) {
      publicChannelList.push(channel);
    }
  }
  return [privateChannelList, publicChannelList];
}

// display the private channel
const showChannelListIfPrivate = (ifPrivate) => {
  getChannelLists()
    .then(channelList => {
      let [ privateChannelList, publicChannelList ] = getBothChannelLists(channelList.channels);
      return ifPrivate ? showChannelList(privateChannelList) : showChannelList(publicChannelList);
    })
    .catch(err => showAlert(err));
}

// define the private button to show the private list
document.getElementById('private-btn').addEventListener('click', () => {
  closeModal();
  showChannelListIfPrivate(true);
})

// define the public button to show the private list
document.getElementById('public-btn').addEventListener('click', () => {
  closeModal();
  showChannelListIfPrivate(false);
})

// call get all the channel lists api
export const getChannelLists = () => {
  return apiCall('channel', 'GET', '', true);
}

// avoid multiple listeners
let joinListener = false;
let ifSaveListener = false;
let ifLeaveListener = false;

// create and display each channel based on the given channel list
export const showChannelList = (channelList) => {
  const channelListDiv = document.getElementById('channel-list');
  removeChilds(channelListDiv)
  // generate each channel dom
  for (let channel of channelList) {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.flexDirection = 'row';
    div.style.justifyContent = 'space-between';
    const p = document.createElement("p");
    const a = document.createElement("a");
    a.href = '#';
    a.classList = 'link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover';
    a.textContent = `${channel.name}`;
    p.appendChild(a);
    p.addEventListener('click', () => {
      closeModal();
      localStorage.setItem('channelId', channel.id);
      removeChilds(document.getElementById('message-screen'));
      showChannelMessages(channel.id);
    })
    // define the edit channel information button
    const editBtn = document.createElement('button');
    editBtn.id = 'edit-btn';
    editBtn.classList = 'btn btn-info';
    editBtn.textContent = 'Info';
    editBtn.addEventListener('click', () => {
      ifSaveListener = false;
      ifLeaveListener = false;
      closeModal();
      showChannelInfo(channel.id);
    });
    
    div.appendChild(p);
    div.appendChild(editBtn);
    
    channelListDiv.appendChild(div);
  }
}

// join channel api
const joinChannel = (channelId) => {
  return apiCall(`channel/${channelId}/join`, 'POST', {}, true);
}


// display the join button if the user is not the member
export const showJoinBtn = (channelId, err) => {
  if (err === 'Authorised user is not a member of this channel') {
    showAlert(err);
    document.getElementById('join-btn').style.display = 'inline';
    if (!joinListener) {
      document.getElementById('join-btn').addEventListener('click', () => {
        closeModal();
        joinChannel(channelId)
          .then(() => {
            showChannelMessages(channelId);
            updateJoinedChannelMsgList();
          })
          .catch(showAlert);
        closeAlert();
      })
      joinListener = true;
    }
  } else {
    showAlert(err);
  }
}

// update the chanel information api
const saveChannelInfo = (channelId, body) => {
  return apiCall(`channel/${channelId}`, 'PUT', body, true);
}

// leave channel api
const leaveChannel = (channelId) => {
  return apiCall(`channel/${channelId}/leave`, 'POST', {}, true);
}

// add listener to save button
let saveChannelId;
const saveBtnAddListener = (channelInfo) => {
  if(!ifSaveListener) {
    ifSaveListener = true;
    document.getElementById('channel-info-save-btn').addEventListener('click', () => {
      const body = {
        name: document.getElementById('info-channel-name').value,
        description: document.getElementById('info-channel-description').value
      };
      saveChannelInfo(saveChannelId, body)
        .catch(err => showAlert(err));
      closeModal();
      showChannelListIfPrivate(channelInfo.private);
    });
  }
}
// display the channel information
const showChannelInfo = (channelId) => {
  saveChannelId = channelId;
  apiCall(`channel/${channelId}`, 'GET', '', true)
    .then(channelInfo => {
      // get the channel creator's name and display the channel information
      getUserInfo(channelInfo.creator)
        .then(userInfo => {
          document.getElementById('info-channel-name').value = channelInfo.name;
          document.getElementById('info-channel-description').value = channelInfo.description;
          document.getElementById('info-channel-ifprivate').textContent = 'Private: ' + channelInfo.private;
          document.getElementById('info-channel-create-time').textContent = 'Create Time: ' + ISOtoDate(channelInfo.createdAt);
          document.getElementById('info-channel-creator-name').textContent = 'Creator Name: ' + userInfo.name;
        })
        .catch(showAlert);
      // display the doms on channel information modal
      document.getElementById('modal-channel-info').style.display = 'block';
      // save the information if clicked
      saveBtnAddListener(channelInfo);

      // leave the channel if button clicked
      document.getElementById('channel-info-leave-btn').addEventListener('click', () => {
        if(!ifLeaveListener) {
          ifLeaveListener = true;
          leaveChannel(saveChannelId)
            .then(() => {
              document.getElementById('message-box').style.display = 'none';
              removeChilds(document.getElementById('message-screen'));
              document.getElementsByClassName('message-header')[0].style.display = 'none';
            })
            .catch(err => showAlert(err));
          closeModal();
          showChannelListIfPrivate(channelInfo.private);
        }
      });
      document.getElementById('channel-info-close-btn').addEventListener('click', () => {
        closeModal();
      });
    })
    .catch(err => {
      // if the user is not in the channel, show join button
      showAlert(err);
      showJoinBtn(channelId, err);
    });
}

// show the channel create modal if create button is clicked
document.getElementById('channel-create-btn').addEventListener('click', () => {
  document.getElementById('modal-channel-create').style.display = 'block';
})

// close the modal if close button is clicked
document.getElementById('channel-close-btn').addEventListener('click', () => {
  closeModal();
})

// submit the created channel information if submit is clicked
document.getElementById('channel-submit-btn').addEventListener('click', () => {
  const channelName = document.getElementById('create-channel-name').value;
  const channelDescription = document.getElementById('create-channel-description').value;
  const ifPrivate = document.getElementById('private-select-create').value === '1' ? true : false;
  apiCall('channel', 'POST', {
    name: channelName,
    private: ifPrivate,
    description: channelDescription
  }, true)
    .then(data => {
      showChannelListIfPrivate(ifPrivate);
    })
    .catch(err => showAlert(err));
  closeModal();
})
