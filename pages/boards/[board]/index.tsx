import {GetServerSideProps, InferGetServerSidePropsType} from 'next'
import Image from 'next/image'
import { boardRepo } from '../../../lib/firebaseadmin'
import { Post } from '../../../lib/models'
import styles from '../../../styles/Catalog.module.css'
import Layout from '../../../components/Layout'
import { threadId } from 'worker_threads'
import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { BoardMetadata } from '../../_app'
import BoardTitle from '../../../components/BoardTitle'
import Router from 'next/router'
import { getDownloadURL, ref } from 'firebase/storage'
import { firestore, storage } from '../../../lib/firebase'
import _ from 'lodash'
import { collection, getCountFromServer, query, where } from 'firebase/firestore'

/*export function getStaticPaths(){
    return {
        paths: flatboards.map(b => ({
            params: {board: b}
        }))
    }
}*/

type ThreadInfo = {
    title: string,
    head: Post
}

type BoardData = {
    board: BoardMetadata,
    threads: ThreadInfo[],
}

export async function getServerSideProps(context) {
    const boardName: string = context.params.board
    console.log(boardName)

    const board = await boardRepo.findById(boardName)

    let threads: ThreadInfo[] = []

    if(!!board.threads){
        threads = await Promise.all((await board.threads.find()).map(async t => ({
                title: t.title ?? null,
                head: JSON.parse(JSON.stringify(await t.posts.findById(t.id)))
        })))
    }

    const data: BoardData = {
        board: {
            id: board.id,
            name: board.name,
            category: board.category
        },
        threads
    }

    return {
        props: {
            data
        }
    }
}

const Thread = ({current,thread} : {current: string,thread: ThreadInfo}) => {
    const [downloadurl,setdownloadurl] = useState<string | null>(null)
    const [replies,setReplies] = useState<number>(0)
    const [imageReplies,setImageReplies] = useState<number>(0)

    useEffect(() => {
        getDownloadURL(ref(storage,`/thumbnails/${thread.head.image}`))
            .then(setdownloadurl)

        getCountFromServer(collection(firestore,`/Boards/${current}/Threads/${thread.head.id}/Posts`))
            .then(snap => setReplies(snap.data().count - 1))

        getCountFromServer(
            query(
                collection(firestore,`/Boards/${current}/Threads/${thread.head.id}/Posts`),
                where('image','!=',null)
            ))
            .then(snap => setImageReplies(snap.data().count - 1))
    },[thread])

    return (
        <div className={styles.thread}>
            <Link href={`/boards/${current}/thread/${thread.head.id}`}>
                <img
                    src={downloadurl}
                    alt="img"
                    style={{width:"100%",cursor:"pointer"}}
                />
            </Link>
            <div>
                R: {replies} / I: {imageReplies}
            </div>
            <div className={styles.title}>
                {thread.title}
            </div>
            <div className={styles.headline}>
                {thread.head.content}
            </div>
        </div>
    )
}

const CreateNewThread = ({board} : {board: BoardMetadata}) => {
    const [username,setusername] = useState<string>("")
    const [subject,setsubject] = useState<string>("")
    const [comment,setcomment] = useState<string>("")
    const [file,setfile] = useState<File | null>(null)
    const [showerr,setshowerr] = useState<string>("")
    const [disablePost,setDisablePost] = useState<boolean>(false)

    const submitThread = async () => {
        setDisablePost(true)

        const formData = new FormData()
        formData.append('username',username)
        formData.append('board',board.id)
        formData.append('subject',subject)
        formData.append('comment',comment)

        if(!file){
            setshowerr("please upload thumbnail good sir")
            setDisablePost(false)
            return
        }

            formData.append('thumbnail',file,file.name)

        fetch('/api/newthread',{
            method: 'POST',
            body: formData
        })
            .then(async res => {
                const tid = (await res.json())
                console.log('success')
                setshowerr("")
                Router.push(`/boards/${board.id}/thread/${tid.message}`)
                setDisablePost(false)
            })
            .catch(err => {
                console.log('error',err)
                setshowerr("server error")
                setDisablePost(false)
            })
    }


    return (
        <div className={styles.createnewthread}>
            <div className={`${styles.label} ${styles.namelabel}`}>Name</div>
            <input type="text" onChange={ev => setusername(ev.target.value)} placeholder='Anonymous' className={`${styles.input} ${styles.nameinput}`} />
            <div className={`${styles.label} ${styles.subjectlabel}`}>Subject</div>
            <input type="text" onChange={ev => setsubject(ev.target.value)} className={`${styles.input} ${styles.subjectinput}`} autoFocus />
            <div className={`${styles.label} ${styles.commentlabel}`}>Comment</div>
            <textarea onChange={ev => setcomment(ev.target.value)} className={`${styles.input} ${styles.commentinput}`} />
            <div className={`${styles.label} ${styles.filelabel}`}>File</div>
            <input type="file" onChange={ev => setfile(ev.target.files[0])} className={`${styles.input} ${styles.fileinput}`} />
            <div className={styles.error} style={{display: showerr ? 'inline' : 'none'}}>
                {showerr}
            </div>

            <button disabled={disablePost} onClick={_.debounce(submitThread,2000)} className={styles.postbtn} style={{cursor: !disablePost ? 'auto' : 'wait'}}>Post</button>
        </div>
    )
}

export default function Page({data} : Record<"data",BoardData>){
    const [shownewthread,setshownewthread] = useState<boolean>(false)


    return (
    <Layout>
        <BoardTitle board={data.board}/>
        {!shownewthread && 
        (<div className={styles.startnewthreadbtn} onClick={() => setshownewthread(true)}>
            <span style={{color:"maroon"}}>{'['}</span>
            Start a New Thread
            <span style={{color:"maroon"}}>{']'}</span>
        </div>)}
        {shownewthread && (
            <CreateNewThread board={data.board} />
        )}
        <div className={styles.threads}>
            {data.threads.map(t => (
                <Thread key={t.head.id} thread={t} current={data.board.id} />
            ))}
        </div>
    </Layout>)
}