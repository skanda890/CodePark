// src/index.js
import firebase from 'firebase/app'
import 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyCLvXN9jUa2eYHNJd5SdQ9WHonQqCUi4EM',
  authDomain: 'real-time-chat-b5bf4.firebaseapp.com',
  projectId: 'real-time-chat-b5bf4',
  storageBucket: 'real-time-chat-b5bf4.appspot.com',
  messagingSenderId: '339845194129',
  appId: '1:339845194129:web:551c29ffd878ef2c267a30',
  measurementId: 'G-8Y8JF761RP'
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

messaging
  .requestPermission()
  .then(() => {
    console.log('Notification permission granted.')
    return messaging.getToken()
  })
  .then((token) => {
    console.log('FCM Token:', token)
    // Send the token to your server to subscribe the user to notifications
  })
  .catch((error) => {
    console.error('Unable to get permission to notify.', error)
  })

messaging.onMessage((payload) => {
  console.log('Message received. ', payload)
  // Display the notification to the user
})
