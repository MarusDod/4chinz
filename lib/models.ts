import { Url } from "url"
import { Collection, getRepository, IEntity, ISubCollection, SubCollection } from "fireorm"
import { Timestamp } from "firebase-admin/firestore"

export type ID = string

export class User {
    username: string | null
    uid: string
}

export class Post {
    id: ID
    createdAt: Timestamp
    poster: User
    replies: ID[]
    image: string
    content: string
    isThread: boolean
    title?: string
}

export class Thread {
    id: ID
    title: string
    @SubCollection(Post)
    posts: ISubCollection<Post>
}

@Collection()
export class Board {
    id: string
    name: string
    category: string
    @SubCollection(Thread)
    threads: ISubCollection<Thread>
}