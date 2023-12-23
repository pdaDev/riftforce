const { initializeApp } = require("firebase/app")
const { getStorage, uploadBytes, getDownloadURL, 
    deleteObject, ref } = require("firebase/storage")
const { v4: uuid } = require('uuid')

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

class FileStorage {
    constructor() {
        this._app = initializeApp(firebaseConfig)
        this._storage = getStorage(this._app)
    }

    saveFile = async (avatar) => {
        const storageRef = ref(this._storage, uuid())
        const upload = await  uploadBytes(storageRef, avatar.buffer, {
            contentType: avatar.mimetype,
        })
        const url = await getDownloadURL(upload.ref)
        return url
    }

    deleteFile = async (url) => {
        await deleteObject(ref(this._storage, url))
    }
}

module.exports = new FileStorage()