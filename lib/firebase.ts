import {initializeApp} from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectDatabaseEmulator, getDatabase } from 'firebase/database';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyA9Kz79n3KqbwxzMTOYiOoVg9Dzkjy5O64",
    authDomain: "faxx-ba683.firebaseapp.com",
    databaseURL: "https://faxx-ba683-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "faxx-ba683",
    storageBucket: "faxx-ba683.appspot.com",
    messagingSenderId: "1032332684983",
    appId: "1:1032332684983:web:008aae5798e290ec192732"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const firestore = getFirestore()
export const database = getDatabase()
export const storage = getStorage()

if(process.env.NEXT_PUBLIC_DEV == '1'){
  connectFirestoreEmulator(firestore,'localhost',8080)
  connectDatabaseEmulator(database,'localhost',9000)
  connectStorageEmulator(storage,'127.0.0.1',9199)
}

export default app