import { uuidv4 } from '@firebase/util';
import { assert } from 'console';
import * as firebaseAdmin from 'firebase-admin';
const {Storage} = require('@google-cloud/storage');
import { Timestamp } from 'firebase/firestore';
import { initialize as fodase, createBatch, getRepository } from 'fireorm'
import formidable from 'formidable';
import PersistentFile from 'formidable/PersistentFile';
import { readFile, readFileSync } from 'fs';

// get this JSON from the Firebase board
// you can also store the values in environment variables
//import serviceAccount from '../firebasesecret.json';
import { Board, Post, Thread, User } from './models';

if(!firebaseAdmin.apps.length){
    firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
            privateKey: process.env.private_key,
            clientEmail: process.env.client_email,
            projectId: process.env.project_id,
        }),
        databaseURL: 'https://faxx-ba683-default-rtdb.europe-west1.firebasedatabase.app',
        storageBucket: 'faxx-ba683.appspot.com',
    });
}

export default firebaseAdmin;

export const firestore = firebaseAdmin.firestore()
export const storage = firebaseAdmin.storage()

fodase(firestore)

export const boardRepo = getRepository(Board)

export const increasePostCount = async (): Promise<string> => {
    const val: string = (await firestore.collection('variables').doc('counter').get()).data().value.toString()

    firestore.collection('variables').doc('counter').set({
        value: parseInt(val)+1
    })

    return val
}

export const uploadToStorage = async (file: formidable.File,postid: string): Promise<string> => {
    const destination = `thumbnails/${postid}`;
    
    const metadata = {
        metadata: {
            displayName: file.originalFilename,
        }
    }

    const buffer = readFileSync(file.filepath)

    const handle = storage.bucket().file(destination)

    await handle.save(buffer)
    await handle.setMetadata(metadata)

    return postid
}