import { Timestamp } from "firebase-admin/firestore"
import { getRepository } from "fireorm"
import { NextApiRequest, NextApiResponse } from "next"
import formidable from 'formidable'
import { boardRepo, firestore, increasePostCount, uploadToStorage } from "../../lib/firebaseadmin"
import { Post, Thread } from "../../lib/models"
import { BoardMetadata } from "../_app"
import { resolve } from "path"
import { STATUS_CODES } from "http"
import PersistentFile from "formidable/PersistentFile"
import { genUID } from "../../lib/helpers"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method !== 'POST')
        return

    console.log(req.body)

    const form = formidable.formidable()
    const {fields,files}: {fields: any, files: any} = await new Promise((res,rej) => form.parse(req,(err,fields,files) => {
        if(err)
            rej(err)

        res({fields,files})
    }))

    console.log('fields',fields)
    console.log('files',files)

    const {board: boardid,username,subject,comment} = fields
    const thumbnail: formidable.File | undefined = files.thumbnail
    const board = await boardRepo.findById(boardid)
    const postid = await increasePostCount()
    const uid = genUID(req,postid)

    let newthread = new Thread()
    newthread.id = postid
    newthread.title = fields.subject

    let newpost = new Post()
    newpost.id = postid
    newpost.content = comment
            .replaceAll(/</g, "&lt;")
            .replaceAll(/>/g, "&gt;");
    newpost.title = subject
    newpost.isThread = true
    newpost.replies = []
    newpost.createdAt = Timestamp.now()
    newpost.poster = {
        uid,
        username: username
    }

    if(thumbnail)
        newpost.image = await uploadToStorage(thumbnail,newpost.id)


    const thread = await board.threads.create(newthread)

    thread.posts.create(newpost)
        .catch(err => {
            console.error(err)
            res.status(500).send({})
        })
        .then(() => {
            res.status(200).send({message: newpost.id})
        })

}

export default handler

export const config = {
    api: {
        bodyParser: false,
    }
}