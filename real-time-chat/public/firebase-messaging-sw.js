importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCLvXN9jUa2eYHNJd5SdQ9WHonQqCUi4EM',
  authDomain: 'real-time-chat-b5bf4.firebaseapp.com',
  projectId: 'real-time-chat-b5bf4',
  storageBucket: 'real-time-chat-b5bf4.appspot.com',
  messagingSenderId: '339845194129',
  appId: '1:339845194129:web:551c29ffd878ef2c267a30',
  measurementId: 'G-8Y8JF761RP'
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload)
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
