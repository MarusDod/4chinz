import admin from 'firebase-admin';
import dotenv from 'dotenv'
import * as fireorm from 'fireorm'

if(process.env.EMULATOR == "1"){
    dotenv.config()
}

const credentials = require('../../firebasesecret.json')

const app = admin.initializeApp({
    credential: admin.credential.cert(credentials),
    databaseURL: 'https://faxx-ba683-default-rtdb.europe-west1.firebasedatabase.app',
    storageBucket: "faxx-ba683.appspot.com"
});


export default app;

export const firestore = app.firestore()
export const database = app.database()
export const storage = app.storage()

fireorm.initialize(firestore)