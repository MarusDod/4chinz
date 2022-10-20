import { Timestamp } from "firebase-admin/firestore"
import { getRepository } from "fireorm"
import formidable from "formidable"
import { NextApiRequest, NextApiResponse } from "next"
import { boardRepo, firestore, uploadToStorage } from "../../lib/firebaseadmin"
import { genUID } from "../../lib/helpers"
import { Post } from "../../lib/models"
import { BoardMetadata } from "../_app"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method !== 'POST')
        return

    const form = formidable.formidable()
    const {fields,files}: {fields: any, files: any} = await new Promise((res,rej) => form.parse(req,(err,fields,files) => {
        if(err)
            rej(err)

        res({fields,files})
    }))

    const username: string = fields.username
    const comment: string = fields.comment
            .replaceAll(/</g, "&lt;")
            .replaceAll(/>/g, "&gt;");
    const thumbnail: formidable.File | undefined = files.thumbnail

    console.log(comment)

    const tid = fields.tid;
    const board: string = fields.board;
    const uid = genUID(req,tid)


    let post: Post = {
        poster: {
            username,
            uid,
        },
        image: null,
        content: comment,
        replies: [],
        isThread: false,
        createdAt: Timestamp.now(),
        id: (await firestore.collection('variables').doc('counter').get()).data().value.toString()
    }

    if(thumbnail){
        if(!['image/jpeg','image/jpg','image/png','gif'].includes(thumbnail.mimetype)){
            res.json({message: 'err',reason: 'invalid mimetype'})
            return
        }
        post.image = await uploadToStorage(thumbnail,post.id)
    }

    console.log('post',post)

    firestore.collection('variables').doc('counter').set({
        value: parseInt(post.id)+1
    })

    const thread =(await (await boardRepo.findById(board)).threads.findById(tid));

    const replies = (comment.match(/&gt;&gt;(\d+)/g) ?? []).map(s => s.substring(8))

    if(replies.length !== 0){
        const replied = (await thread.posts.whereIn('id',replies).find()).map((p: Post) => {
            p.replies.push(post.id)
            return p
        })

        replied.forEach(r => thread.posts.update(r))
    }


    thread.posts.create(post)
        .catch(err => {
            console.error(err)
            res.json({message:'err',reason: 'internal server error'})
        })
        .then(() => {
            res.json({message: 'ok'})
        })

}

export default handler

export const config = {
    api: {
        bodyParser: false,
    }
}