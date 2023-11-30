/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 * 
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
 
export function fileToDataUrl(file) {
    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ]
    const valid = validFileTypes.find(type => type === file.type);
    // Bad data, let's walk away.
    if (!valid) {
        throw Error('provided file is not a png, jpg or jpeg image.');
    }
    
    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve,reject) => {
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    return dataUrlPromise;
}

// apicall collections
export const apiCall = (path, method, body, authed=false) => {
    switch(method) {
      case 'POST':
        return apiCallPOST(path, body, authed);
      case 'GET':
        return apiCallGET(path, body, authed);
      case 'PUT':
        return apiCallPUT(path, body, authed);
      case 'DELETE':
        return apiCallDELETE(path, body, authed);
    }
}

// api get
const apiCallGET = (path, body, authed=false) => {
  return new Promise((resolve, reject) => {
    fetch('http://localhost:5005/' + path + '?' + body, {
        method: 'GET',
        headers: {
            'Content-type': 'application/json',
            'Authorization': authed ? `Bearer ${localStorage.getItem('token')}` : undefined
        }
    })
    .then((response) => response.json())
    .then(data => {
        if (data.error) {
            reject(data.error);
        }
        else {
            resolve(data);
        }
    });
  });
}

// api post
const apiCallPOST = (path, body, authed=false) => {
  return new Promise((resolve, reject) => {
      fetch('http://localhost:5005/' + path, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'Authorization': authed ? `Bearer ${localStorage.getItem('token')}` : undefined
          },
        body: JSON.stringify(body)
      })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data);
        }
      });
  })
};

// api put
const apiCallPUT = (path, body, authed=false) => {
  return new Promise((resolve, reject) => {
      fetch('http://localhost:5005/' + path, {
        method: 'PUT',
        headers: {
            'Content-type': 'application/json',
            'Authorization': authed ? `Bearer ${localStorage.getItem('token')}` : undefined
          },
        body: JSON.stringify(body)
      })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data);
        }
      });
  })
};

// api delete
const apiCallDELETE = (path, body, authed=false) => {
  return new Promise((resolve, reject) => {
      fetch('http://localhost:5005/' + path, {
        method: 'DELETE',
        headers: {
            'Content-type': 'application/json',
            'Authorization': authed ? `Bearer ${localStorage.getItem('token')}` : undefined
          },
        body: JSON.stringify(body)
      })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data);
        }
      });
  })
};

// hide the alert
export const closeAlert = () => {
  document.getElementById('alert').style.display = 'none';
}

// hide all the elements with .hide class
export const hideElements = () => {
  for (const element of document.querySelectorAll('.hide')) {
    element.style.display = 'none';
  }
}

// switch hide and show with .page-block class
export const showPage = (pageName) => {
  closeAlert();
  for (const page of document.querySelectorAll('.page-block')) {
    page.style.display = 'none';
  }
  document.getElementById(pageName).style.display = 'block';
}

// display the alert dom
export const showAlert = (msg) => {
  const alertPopup = document.getElementById('alert');
  document.getElementById('alert-text').innerText = msg;
  alertPopup.style.display = 'block';
  document.getElementById('join-btn').style.display = 'none';
  document.getElementById('close-alert').addEventListener('click', () => {
    alertPopup.style.display = 'none';
  })
}

// close all modal dom with .modal class
export const closeModal = () => {
  for (const element of document.querySelectorAll('.modal')) {
    element.style.display = 'none';
  }
}

// convert iso string to date string
export const ISOtoDate = (ISO) => {
  const date = new Date(ISO);
  return date.toLocaleDateString();
}

// convert iso string to local time string
export const ISOtoTime = (ISO) => {
  const date = new Date(ISO);
  return date.toLocaleString();
}

// remove all children within a node
export const removeChilds = (node) => {
  while (node.hasChildNodes()) {
    node.removeChild(node.firstChild);
  }
}