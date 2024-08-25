// src/index.js
import firebase from 'firebase/app'
import 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
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
