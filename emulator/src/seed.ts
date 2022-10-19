import { uuidv4 } from "@firebase/util"
import { Timestamp } from "firebase-admin/firestore"
import { Collection, getRepository, IEntity, ISubCollection, SubCollection } from "fireorm"
import {Board, Post, Thread} from './models'

process.env['EMULATOR'] = "1"

import { firestore,storage } from "./init"

const board: Board = new Board()
board.id = 'g'
board.name = 'technology'
board.category = "interests"

const board1: Board = new Board()
board1.id = 'a'
board1.name = 'anime'
board1.category = "cartoons"

const board2: Board = new Board()
board2.id = 'pol'
board2.name = 'politically correct'
board2.category = "politics"

const thread: Thread = new Thread()
thread.id = '0'
thread.title = 'sup fags'

const posts: Array<Post> = [
                {
                    poster: {
                        uid: '1223A',
                        username: null
                    },
                    createdAt: Timestamp.now(),
                    content: "title",
                    image: "0",
                    isThread: true,
                    replies: [],
                    id: '0'
                },
                {
                    poster: {
                        uid: '1223B',
                        username: null
                    },
                    content: "hey",
                    createdAt: Timestamp.now(),
                    image: null,
                    isThread: false,
                    replies: [],
                    id: '1'
                }
            ]

const boardRepo = getRepository(Board);
console.log("he");

//firestore.collection('Boards').get().then(res => console.log(res.docs))

(async () => {
    //const board = await boardRepo.findById('g');
    await boardRepo.create(board)
    await boardRepo.create(board1)
    await board.threads.create(thread)
    await thread.posts.create(posts[0])
    await thread.posts.create(posts[1])
})()

firestore.collection('variables').doc('counter').set({value: 2})

storage.bucket().upload('./testData/shekels.jpg',{
    destination: '/thumbnails/0',
    metadata: {
        metadata: {
            displayName: 'shekels.jpg'
        }
    }
}).catch(err => console.error(err))
