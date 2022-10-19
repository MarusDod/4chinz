import { GetServerSideProps, GetServerSidePropsContext, NextApiRequest } from "next"
import { AppContext } from "next/app"
import {Md5} from 'ts-md5'
import moment from 'moment'
import Layout from "../../../../components/Layout"
import { boardRepo } from "../../../../lib/firebaseadmin"
import { Board, Post, Thread } from "../../../../lib/models"
import { BoardMetadata } from "../../../_app"
import styles from '../../../../styles/Thread.module.css'
import Link from "next/link"
import { firestore, storage } from "../../../../lib/firebase"
import { DOMElement, useEffect, useRef, useState } from "react"
import { FullMetadata, getDownloadURL, getMetadata, ref } from "firebase/storage"
import { collection, onSnapshot, Query, query, Timestamp, where } from "firebase/firestore"
import BoardTitle from "../../../../components/BoardTitle"
import Router from "next/router"
import { genUID } from "../../../../lib/helpers"

type ThreadProps = {
    board: BoardMetadata,
    title: string,
    uid: string,
    posts: Post[],
}

const diffPosters = (posts: Post[]) => {
    return Object.keys(posts.reduce((prev,curr) => {
        prev[curr.poster.uid] = true

        return prev
    },{})).length
}

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<{props: {data: ThreadProps}}> {
    const tid: string = context.params.thread[0]

    const uid: string = genUID(context.req as NextApiRequest,tid)

    const boardName: string = context.params.board[0]

    const board = await boardRepo.findById(boardName)
    const thread: Thread = await board.threads.findById(tid)
    const posts: Post[] = await thread.posts.find()

    return {
        props: {
            data: {
                board: {
                    id: board.id,
                    category: board.category,
                    name: board.name,
                },
                title: thread.title,
                uid,
                posts: JSON.parse(JSON.stringify(posts  ))
            }
        }
    }
}

const PostContainer = ({board,post,main}: {board: string,post: Post,main: boolean}) => {
    const [downloadurl,setdownloadurl] = useState<string | null>(null)
    const [metadata,setmetadata] = useState<FullMetadata | null>(null)
    const [expand,setexpand] = useState<boolean>(false)
    const imgref = useRef()

    const parseContent = (content : string) => {
        const strcolor = content.replace(/>>\d+/g, match=> `<a style="color:blue" href="#${match.substring(2)}">${match}</a>`)

        return strcolor
    }


    useEffect(() => {
        if(!post.image)
            return

        const fileref = ref(storage,`/thumbnails/${post.id}`)

        Promise.all([
            getMetadata(fileref),
            getDownloadURL(fileref)
        ])
            .then(([metadata,url]) => {
                setdownloadurl(url)
                setmetadata(metadata)
            })
    },[post])

    return (
        <div id={post.id} className={`${styles.postcontainer} ${main ? styles.mainpostcontainer: ''}`}>
            <div className={styles.timestamp}>
                {main && (<span className={styles.title} style={{clear: expand ? 'both' : 'none'}}>
                    /{board}/ - {post.title}
                </span>)}
                <span>{post.poster.username == '' ? 'Anonymous' : post.poster.username}</span> 
                <span style={{margin:"0 .5rem"}}>(ID: {post.poster.uid})</span>
                <span>{`${moment(typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.seconds).format("DD/MM/YYYY(ddd)hh:mm:ss")} No. ${post.id}`}</span>
                <span className={styles.replies}>
                    {post.replies.map(r => (
                        <a key={r} href={'#' + r} className={styles.postreply}>
                            {'>>'}{r}
                        </a>
                    ))}
                </span>
            </div>
            <div className={styles.timestamp}>
            {imgref.current && (
                <span>File: <a target="_blank" rel="noreferrer" href={downloadurl}>{metadata.customMetadata['displayName']}</a> ({metadata.size / 1000}KB {imgref.current['width']}x{imgref.current['height']})</span>
            )}
            </div>
            <div className={styles.content}>
                {post.image && downloadurl && (
                <div onClick={() => setexpand(expand => !expand)} className={styles.image}>
                    <img ref={imgref} src={downloadurl} alt="thumb" width={expand ? "100%" : main ? "250px" : "120px"}/>
                </div>)}
                
                <div dangerouslySetInnerHTML={{__html: parseContent(post.content)}} className={styles.text} style={{clear: expand ? 'both' : 'none'}}>
                </div>
            </div>
        </div>
    )
}

const PostReply = ({hide,referee,board,tid} : {hide: () => void,referee?: string,board: string,tid: string}) => {
    const [showerr,setshowerr] = useState<boolean>(false)
    const [name,setname] = useState<string>("")
    const [comment,setcomment] = useState<string>(referee ? `>>${referee}` : "")
    const [file,setfile] = useState<File | null>(null)

    const topref = useRef()
    const touchref = useRef()

    useEffect(() => {
        const topEl = topref.current as HTMLElement
        const el = touchref.current as HTMLElement

        let down: boolean = false;
        let offset: {x: number,y: number} = {
            x: 0,
            y: 0,
        }
        const mouseDownCallback = (ev: MouseEvent) => {
            ev.preventDefault()
            down = true
            offset = {
                x:  ev.clientX - topEl.offsetLeft,
                y:  ev.clientY - topEl.offsetTop
            }
        }

        const mouseUpCallback = (ev: MouseEvent) => {
            down = false
        }

        const mouseMoveCallback = (ev: MouseEvent) => {
            if(!down)
                return
                
            topEl.style.left = (ev.clientX - offset.x).toString() + 'px'
            topEl.style.top = (ev.clientY - offset.y).toString() + 'px'
        }
        
        el.addEventListener('mousedown',mouseDownCallback)
        el.addEventListener('touchstart',mouseDownCallback)
        document.addEventListener('mouseup',mouseUpCallback)
        document.addEventListener('touchend',mouseUpCallback)
        document.addEventListener('mousemove',mouseMoveCallback)
        document.addEventListener('touchmove',mouseMoveCallback)

        return () => {
            el.removeEventListener('mousedown',mouseDownCallback)
            el.removeEventListener('touchstart',mouseDownCallback)
            document.removeEventListener('mouseup',mouseUpCallback)
            document.removeEventListener('touchend',mouseUpCallback)
            document.removeEventListener('mousemove',mouseMoveCallback)
            document.removeEventListener('touchmove',mouseMoveCallback)
        }
    },[])

    const submit = () => {
        const formData = new FormData()
        formData.append('username',name)
        formData.append('board',board)
        formData.append('comment',comment)
        formData.append('tid',tid)

        if(file){
            formData.append('thumbnail',file,file.name)
        }

        fetch('/api/newpost',{
            method: 'POST',
            body: formData
        })
            .then(() => {
                console.log('success')
                setshowerr(false)
                setcomment("")
                setname("")
                setfile(null)
                hide()
            })
            .catch(err => {
                console.error('error',err)
                setshowerr(true)
            })
    }

    return (
        <div ref={topref} className={styles.reply}>
            <div ref={touchref} className={styles.touchreply}>
                Reply to Thread: No.{tid} 
                <button onClick={hide} style={{float:'right'}}>X</button>
            </div>
            <input value={name} onChange={ev => setname(ev.target.value)} className={styles.title} type="text" placeholder="Name" />
            <input className={styles.title} type="text" placeholder="Options" />
            <textarea value={comment} onChange={ev => setcomment(ev.target.value)} className={`${styles.title} ${styles.comment}`} placeholder="Comment" />
            <div style={{display:'flex',margin:0,justifySelf:"flex-end",justifyContent:'space-between',fontSize:"1.5rem",color:'grey'}}>
                <input onChange={ev => setfile(ev.target.files[0])} type="file" accept="image/jpeg, image/jpg, image/png" />
                <button onClick={submit}>Post</button>
            </div>
            <div className={styles.error} style={{display: showerr ? 'inline-block':'none'}}>
                err
            </div>
        </div>
    )
}

export default function Page({data: {board,title,posts}}: {data: ThreadProps}){
    const [showreply,setshowreply] = useState<boolean>(false)
    const [postState,setPostState] = useState<Post[]>(posts.sort((a,b) => parseInt(a.id) - parseInt(b.id)))

    useEffect(() => {
        let f = true
        
        const unsub = onSnapshot(
            query(
                collection(firestore,`/Boards/${board.id}/Threads/${posts[0].id}/Posts`),
            ),
            snap => {
                if(f){
                    f = false
                    return
                }

                snap.docChanges().forEach(c => {
                    if(c.type == 'added'){
                        setPostState((postState: Post[]) => ([...postState,c.doc.data() as Post]))
                    }
                })
        },error => console.error(error))

        return () => {
            unsub()
        }
    },[]);

    return (
        <Layout>
            <BoardTitle board={board}/>
            <div onClick={() => setshowreply(true)} className={styles.postreplybtn} style={{fontWeight:'bold',fontSize:'2.5rem'}}>
                [Post a Reply]
            </div>
            <div className={styles.postcount}>
               <span onClick={() => Router.push(`/boards/${board.id}`)} className={styles.postreplybtn} style={{marginLeft:0}} >[Catalog]</span> 
               <span className={styles.tooltip}>{postState.filter(p => p.image).length} <span className={styles.tooltiptext}>images</span></span> / 
               <span className={styles.tooltip}>{postState.length} <span className={styles.tooltiptext}>posts</span></span> / 
               <span className={styles.tooltip}>{diffPosters(postState)}<span className={styles.tooltiptext}>users</span></span>
            </div>
            {postState.map((p: Post,index: number) => (
                <PostContainer key={p.id} {...({main: index === 0})} board={board.id} post={p} />
            ))}
            {showreply && <PostReply hide={() => setshowreply(false)} board={board.id} tid={postState[0].id} />}
            <div className={styles.postcount}>
                <div onClick={() => setshowreply(true)} className={styles.postreplybtn}>[ post reply ]</div>
                <div>{postState.length} / 0</div>
            </div>
        </Layout>
    )
}