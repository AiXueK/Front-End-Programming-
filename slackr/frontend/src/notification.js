import { showAlert } from "./helpers.js";
import { getChannelLists } from "./channel.js";
import { getChannelMsg, showChannelMessages } from "./message.js";

document.getElementById('notification-close').addEventListener('click', () => {
  document.getElementById('notification').style.display = 'none';
})

export let interval;

export const pollNotificatoin = () => {
  if (Notification?.permission === "granted") {
    interval = setInterval(() => {
      updateJoinedChannelMsgList();
    }, 200);
  } else if (Notification && Notification.permission !== "denied") {
    Notification.requestPermission().then((status) => {
      // If the user said okay
      if (status === "granted") {
        // Using an interval cause some browsers (including Firefox) are blocking notifications if there are too much in a certain time.
        interval = setInterval(() => {
          updateJoinedChannelMsgList();
        }, 200);
      } else {
        alert("Hi!");
      }
      });
    } else {
      alert("Hi!");
    }
}

const sendNotification = (notificationContent) => {
  document.getElementById('notification').style.display = 'flex';
  document.getElementById('notification-text').textContent = notificationContent;
}

export const updateJoinedChannelMsgList = () => {
  getChannelLists()
    .then(channelList => {
      let joinedChannelMsgList = JSON.parse(localStorage.getItem('joinedChannelMsgList'));
      for (const channel of channelList.channels) {
        if (channel.members.includes(parseInt(localStorage.getItem('userId')))) {
          let channelId = channel.id;
          getChannelMsg(channelId, 0)
            .then(messages => {
              if (joinedChannelMsgList[channelId.toString()] && joinedChannelMsgList[channelId.toString()] !== messages.messages[0].id) {
                if (channelId.toString() === localStorage.getItem('channelId')) {
                  showChannelMessages(localStorage.getItem('channelId'));
                } else {
                  sendNotification(`New message in channel ${channel.name}`);
                }
              }
              joinedChannelMsgList[channelId.toString()] = messages.messages[0].id;
              localStorage.setItem('joinedChannelMsgList', JSON.stringify(joinedChannelMsgList));
            })
            .catch(showAlert);
        }
      }
    })
}
