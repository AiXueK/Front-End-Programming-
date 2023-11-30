import { removeChilds, showAlert, apiCall, ISOtoTime, closeModal } from "./helpers.js";
import { getUserInfo, showUserProfileModal } from "./user.js";
import { showJoinBtn } from "./channel.js";

// define global vars
let globalChannelId = 0;
let globalMessageId = 0;
let globalMessageBody = {};

// get all messages of the channel api
export const getChannelMsg = (channelId, start) => {
  return apiCall(`message/${channelId}`, 'GET', `start=${start}`, true);
}
// detele message api
const deleteMessage = (channelId, messageId) => {
  return apiCall(`message/${channelId}/${messageId}`, 'DELETE', {}, true);
}
// edit message api
const editMessage = (channelId, messageId, messageBody) => {
  return apiCall(`message/${channelId}/${messageId}`, 'PUT', messageBody, true);
}

// click cancel button to reset the message box dom
document.getElementById('message-cancel-btn').addEventListener('click', () => {
  document.getElementById('message-switch-btn').textContent = 'Edit Image';
  document.getElementById('message-send-btn').style.display = 'flex';
  document.getElementById('message-type').value = '';
  document.getElementById('message-update-btn').style.display = 'none';
  document.getElementById('message-cancel-btn').style.display = 'none';
})

// get the content of the message edit box
const getMessageBody = () => {
  return {
    message: document.getElementById('message-type').value,
    image: document.getElementById('image-type').value
  }
}

// update the message and put existing content on message box
document.getElementById('message-update-btn').addEventListener('click', () => {
  let messageBody = getMessageBody();
  // check if the updated message is not changed
  if (messageBody.message.trim() === globalMessageBody.message.trim() && messageBody.image.trim() === globalMessageBody.image.trim()) {
    showAlert('Please input different message or image!');
  }
  // if changed, update the message and pull the new messages again
  else {
    editMessage(globalChannelId, globalMessageId, messageBody)
      .then(() => {
        document.getElementById('message-update-btn').style.display = 'none';
        document.getElementById('message-cancel-btn').style.display = 'none';
        document.getElementById('message-type').value = '';
        document.getElementById('image-type').value = '';
        document.getElementById('message-send-btn').style.display = 'flex';
        showChannelMessages(globalChannelId);
      })
      .catch(showAlert);
  }
})

// pin message api
const pinMessage = (channelId, messageId) => {
  return apiCall(`message/pin/${channelId}/${messageId}`, 'POST', {}, true);
}
// unpin message api
const unPinMessage = (channelId, messageId) => {
  return apiCall(`message/unpin/${channelId}/${messageId}`, 'POST', {}, true);
}
// react api
const updateReact = (channelId, messageId, reactString) => {
  return apiCall(`message/react/${channelId}/${messageId}`, 'POST', reactString, true);
}
// unreact api
const unReact = (channelId, messageId, reactString) => {
  return apiCall(`message/unreact/${channelId}/${messageId}`, 'POST', reactString, true);
}

// put all react of the user into one string
const getReactString = (message) => {
  let reacString = '';
  for (const reactRecord of message.reacts) {
    if (parseInt(localStorage.getItem('userId')) === reactRecord.user) {
      reacString = reacString + `${reactRecord.react}`;
    }
  }
  return reacString;
}

// get all pinned message list
const getPinnedMessageList = (messageList) => {
  let pinnedMessageList = [];
  localStorage.setItem('modalStart', parseInt(localStorage.getItem('modalStart')) + parseInt(messageList.messages.length));
  for (const message of messageList.messages) {
    if (message.pinned) {
      pinnedMessageList.push(message);
    }
  }
  return pinnedMessageList;
}

// close the pinned message modal and pull the new message list
document.getElementById('pinned-msg-close-btn').addEventListener('click', () => {
  document.getElementById('pinned-msg-modal').style.display = 'none';
  removeChilds(document.getElementById('pinned-msg-modal-body'));
  for (const msgBtn of document.getElementsByClassName('message-btns')) {
    msgBtn.style.display = 'flex';
  }
  showChannelMessages(globalChannelId);
})

// load and show the pinned message set
const loadPinnedMessageSet = (channelId, modalStart, dom) => {
  scrollLock = true;
  // get messages based on start index
  getChannelMsg(channelId, localStorage.getItem('modalStart'))
    .then(messageList => {
      messageList =  getPinnedMessageList(messageList);
      // show the provided message list
      showMessage(messageList, channelId, dom);
      for (const msgBtn of document.getElementsByClassName('message-btns')) {
        msgBtn.style.display = 'none';
      }
      scrollLock = false;
    })
    .catch(err => {
      showAlert(err);
    });
}

// show the pinned message modal if clicked
document.getElementById('pin-msg-btn').addEventListener('click', () => {
  document.getElementById('pinned-msg-modal').style.display = 'flex';
  let pinnedMessageModal = document.getElementById('pinned-msg-modal-body');
  removeChilds(pinnedMessageModal);
  localStorage.setItem('modalStart', 0);
  // display the pinned message list
  loadPinnedMessageSet(globalChannelId, 0, pinnedMessageModal);
  scrollLock = true;
  // load more message if scrolled to top
  pinnedMessageModal.addEventListener('scroll', () => {
    if (!scroll && !scrollLock) {
      scroll = true;
      // 5: pre-load for scroll up content
      if (pinnedMessageModal.offsetHeight - pinnedMessageModal.scrollTop + 5 >= pinnedMessageModal.scrollHeight) {
        loadPinnedMessageSet(globalChannelId, localStorage.getItem('modalStart'), pinnedMessageModal);
      }
      scroll = false;
    }
  })
})

// image enlarged index
let slideIndex = 1;
// generate the show each message based on provided message list and channel
const showMessage = (messageList, channelId, dom) => {
  // generate each message
  for (const message of messageList) {
    let messageDiv = document.getElementsByClassName('message')[0].cloneNode(true);
    messageDiv.style.display = 'flex';
    let messageUserPhoto = messageDiv.getElementsByClassName('message-sender-image')[0];
    let messageInfoDiv = messageDiv.getElementsByClassName('message-info')[0];
    let messageUserName = messageInfoDiv.getElementsByClassName('message-user-name')[0];
    // get the user information for each message
    getUserInfo(message.sender)
      .then(userInfo => {
        messageUserName.textContent = userInfo.name;
        messageUserPhoto.src = userInfo.image ? userInfo.image : localStorage.getItem('defaultImgSrc');
        // show the user profile if user name is clicked
        messageUserName.addEventListener('click', () => {
          showUserProfileModal(message.sender);
        })
      })
      .catch(showAlert);
    let messageTime = messageDiv.getElementsByClassName('message-time')[0];
    // change the appearance if message is edited
    if (message.edited) {
      messageTime.textContent = `Edited: ${ISOtoTime(message.sentAt)}`;
      messageTime.style.color = 'green';
    }
    else{
      messageTime.textContent = ISOtoTime(message.sentAt);
    }
    
    let messageContent = messageDiv.getElementsByClassName('message-content')[0];
    messageContent.textContent = message.message;
    
    let messageBtnDiv = messageDiv.getElementsByClassName('message-btns')[0];
    
    messageBtnDiv.classList = 'message-btns';
    // hide the message edit action buttons from other users
    if (message.sender !== parseInt(localStorage.getItem('userId'))) {
      messageBtnDiv.style.display = 'none';
    }
    // allow message edition if edit button is clicked
    let messageEditBtn = messageDiv.getElementsByClassName('message-edit-btn')[0];
    messageEditBtn.addEventListener('click', () => {
      // focus on the message box and display existed message content on box
      globalChannelId = channelId;
      globalMessageId = message.id;
      const messageBox = document.getElementById('message-box');
      messageBox.focus();
      document.getElementById('message-cancel-btn').style.display = 'flex';
      document.getElementById('message-send-btn').style.display = 'none';
      document.getElementById('message-type').value = message.message;
      document.getElementById('image-type').value = message.image;
      globalMessageBody = getMessageBody();
      document.getElementById('message-update-btn').style.display = 'flex';
    });
    // delete the message if delete btn is clicked
    let messageDeleteBtn = messageDiv.getElementsByClassName('message-delete-btn')[0];
    messageDeleteBtn.addEventListener('click', () => {
      deleteMessage(channelId, message.id)
        .then(() => {
          // show the updated message
          showChannelMessages(channelId);
        })
        .catch(showAlert);
    });
    
    const commonBtnDiv = messageDiv.getElementsByClassName('common-btn')[0];

    let reactionBtnDiv = commonBtnDiv.getElementsByClassName('reaction-btn')[0];
    commonBtnDiv.style.display = 'flex';
    // change the reaction buttons' appearence if clicked
    for (const reactionBtn of reactionBtnDiv.children) {
      if (getReactString(message).includes(reactionBtn.className)) {
        reactionBtn.style.backgroundColor = 'cornflowerblue';
      } else {
        reactionBtn.style.backgroundColor = 'transparent';
      }
      // update the database based on the appearance
      reactionBtn.addEventListener('click', () => {
        if (reactionBtn.style.backgroundColor === 'transparent') {
          updateReact(channelId, message.id, { react: reactionBtn.className })
            .then(() => {
              reactionBtn.style.backgroundColor = 'cornflowerblue';
            })
            .catch(showAlert);
        } else {
          unReact(channelId, message.id, { react: reactionBtn.className })
            .then(() => {
              reactionBtn.style.backgroundColor = 'transparent';
            })
            .catch(showAlert);
        }
      })
    }
    // pin & unpin toggle
    const pinBtn = commonBtnDiv.getElementsByClassName('pin-btn')[0];
    pinBtn.textContent = message.pinned ? 'Unpin' : 'Pin';
    pinBtn.addEventListener('click', () => {
      if (pinBtn.textContent === 'Pin') {
        pinMessage(channelId, message.id)
          .then(() => {
            pinBtn.textContent = 'Unpin';
          })
          .catch(showAlert);
      } else {
        unPinMessage(channelId, message.id)
          .then(() => {
            pinBtn.textContent = 'Pin';
          })
          .catch(showAlert);
      }
    })
    // display message image if there is, otherwise hide image dom
    let messageImg = messageDiv.getElementsByClassName('message-image')[0];
    if (message.image) {
      messageImg.src = message.image;
      messageImg.style.display = 'flex';
      // image enlarged if clicked
      messageImg.addEventListener('click', () => {
        slideIndex = 1;
        let found = false;
        document.getElementById('image-modal').style.display = 'block'
        let imageSlideContent = document.getElementById('image-slide-content');
        for (const slideMessage of messageList) {
          if (slideMessage.image) {
            if (slideMessage.id !== message.id && !found) {
              slideIndex = slideIndex + 1;
            } else {
              found = true;
            }
            let imageSlide = document.getElementsByClassName('image-slide')[0].cloneNode(true);
            let image = imageSlide.getElementsByTagName('img')[0];
            image.src = slideMessage.image;
            imageSlide.classList.add('slide-show');
            imageSlideContent.appendChild(imageSlide);
          }
        }
        showSlides(slideIndex);
      })
    } else {
      messageImg.src = '';
    }
    dom.append(messageDiv);
  }
}
// slide prev to show previous slide
document.getElementById('slide-prev').addEventListener('click', () => {
  plusSlides(1);
})
// slide next to show next slide
document.getElementById('slide-next').addEventListener('click', () => {
  plusSlides(-1);
})

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}
// display the slide based on the index
function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("slide-show");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slides[slideIndex-1].style.display = "block";
}
// close the enlarged image modal
document.getElementById('image-close-btn').addEventListener('click', () => {
  closeModal();
  removeChilds(document.getElementById('image-slide-content'));
})

let scroll = false;
let scrollLock = true;
// load the message based on channeldId and start index
const loadMessageSet = (channelId, start, dom) => {
  scrollLock = true;
  getChannelMsg(channelId, start)
    .then(messageList => {
      start = parseInt(start) + parseInt(messageList.messages.length);
      showMessage(messageList.messages, channelId, dom);
      localStorage.setItem('start', start);
      scrollLock = false;
      document.getElementsByClassName('message-header')[0].style.display = 'flex';
    })
    .catch(err => {
      showAlert(err);
      document.getElementById('message-box').style.display = 'none';
      showJoinBtn(channelId, err);
    });
}
// display and show channel message
export const showChannelMessages = (channelId) => {
  let messageScreen = document.getElementById('message-screen');
  removeChilds(messageScreen);
  localStorage.setItem('start', 0);
  localStorage.setItem('channelId', channelId);
  globalChannelId = channelId;
  showMessageBox(channelId);
  loadMessageSet(channelId, 0, messageScreen);
  scrollLock = true;
  // load more message when scrolled to top
  messageScreen.addEventListener('scroll', () => {
    if (!scroll && !scrollLock) {
      scroll = true;
      // 5: pre-load for scroll up content
      if (messageScreen.offsetHeight - messageScreen.scrollTop + 5 >= messageScreen.scrollHeight) {
        loadMessageSet(channelId, localStorage.getItem('start'), messageScreen);
      }
      scroll = false;
    }
  })
}
// send message api
const sendMessageContent = (channelId, messageBody) => {
  return apiCall(`message/${channelId}`, 'POST', messageBody, true);
}

let sendListener = false;
let switchListener = false;
// display the message typing box
export const showMessageBox = () => {
  const messageBox = document.getElementById('message-box');
  let messageBody = {message: '', image: ''};
  let messageSwitchBtn = document.getElementById('message-switch-btn');
  messageBox.style.display = 'flex';
  if (!switchListener) {
    // toggle edit image and eidt text
    messageSwitchBtn.addEventListener('click', () => {
      messageBody = getMessageBody();
      if (document.getElementById('message-switch-btn').textContent === 'Edit Image') {
        messageSwitchBtn.textContent = 'Edit Text';
        document.getElementById('image-type').style.display = 'flex';
        document.getElementById('message-type').style.display = 'none';
      }
      else {
        messageSwitchBtn.textContent = 'Edit Image';
        document.getElementById('message-type').style.display = 'flex';
        document.getElementById('image-type').style.display = 'none';
      }
    })
    switchListener = true;
  }
  // send message if clicked
  if (!sendListener) {
    document.getElementById('message-send-btn').addEventListener('click', () => {
      messageBody = getMessageBody();
      if (messageBody.message.trim() === '' && messageBody.image.trim() === '') {
        showAlert('Please type in message or image to send!');
      }
      else {
        sendMessageContent(localStorage.getItem('channelId'), messageBody)
          .catch(showAlert);
        showChannelMessages(localStorage.getItem('channelId'));
        document.getElementById('message-type').value = '';
        document.getElementById('image-type').value = '';
      }
    });
    sendListener = true;
  }
}
