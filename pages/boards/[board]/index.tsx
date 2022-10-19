import { firestore } from '../../../lib/firebaseadmin'
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
import { storage } from '../../../lib/firebase'

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
    const boardName: string = context.params.board[0]

    const board = await boardRepo.findById(boardName)

    const threads: ThreadInfo[] = await Promise.all((await board.threads.find()).map(async t => ({
            title: t.title ?? null,
            head: JSON.parse(JSON.stringify(await t.posts.findById(t.id)))
        })))

    console.log(threads)

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

    useEffect(() => {
        getDownloadURL(ref(storage,`/thumbnails/${thread.head.image}`))
            .then(setdownloadurl)
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

    const submitThread = async () => {
        const formData = new FormData()
        formData.append('username',username)
        formData.append('board',board.id)
        formData.append('subject',subject)
        formData.append('comment',comment)

        if(!file){
            setshowerr("please upload thumbnail good sir")
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
            })
            .catch(err => {
                console.log('error',err)
                setshowerr("server error")
            })
    }


    return (
        <div className={styles.createnewthread}>
            <div className={`${styles.label} ${styles.namelabel}`}>Name</div>
            <input type="text" onChange={ev => setusername(ev.target.value)} placeholder='Anonymous' className={`${styles.input} ${styles.nameinput}`} />
            <div className={`${styles.label} ${styles.subjectlabel}`}>Subject</div>
            <input type="text" onChange={ev => setsubject(ev.target.value)} className={`${styles.input} ${styles.subjectinput}`} />
            <div className={`${styles.label} ${styles.commentlabel}`}>Comment</div>
            <textarea onChange={ev => setcomment(ev.target.value)} className={`${styles.input} ${styles.commentinput}`} />
            <div className={`${styles.label} ${styles.filelabel}`}>File</div>
            <input type="file" onChange={ev => setfile(ev.target.files[0])} className={`${styles.input} ${styles.fileinput}`} />
            <div className={styles.error} style={{display: showerr ? 'inline' : 'none'}}>
                {showerr}
            </div>

            <button onClick={submitThread} className={styles.postbtn}>Post</button>
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