const firebase = require("firebase")
require('firebase/storage');
const admin = require('firebase-admin')
require('dotenv').config()

var serviceAccount = require("../../serviceAccountKey.json");

const adminConfig = {
    credential: admin.credential.cert(serviceAccount),
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId
};

const firebaseConfig = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId
}

firebase.initializeApp(firebaseConfig)
admin.initializeApp(adminConfig)

module.exports = {
    admin, firebase
}