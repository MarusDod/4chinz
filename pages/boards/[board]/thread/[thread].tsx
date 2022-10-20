import { GetServerSideProps, GetServerSidePropsContext, NextApiRequest } from "next"
import { AppContext } from "next/app"
import {Md5} from 'ts-md5'
import moment from 'moment'
import Layout from "../../../../components/Layout"
import { boardRepo } from "../../../../lib/firebaseadmin"
import { Board, Post, Thread } from "../../../../lib/models"
import { BoardMetadata } from "../../../_app"
import styles from '../../../../styles/Thread.module.css'
import { firestore, storage } from "../../../../lib/firebase"
import { createContext, useCallback, useContext, useDebugValue, useEffect, useMemo, useRef, useState } from "react"
import { FullMetadata, getDownloadURL, getMetadata, ref } from "firebase/storage"
import { collection, collectionGroup, doc, getDoc, onSnapshot, Query, query, Timestamp, where } from "firebase/firestore"
import BoardTitle from "../../../../components/BoardTitle"
import Router from "next/router"
import { genUID, parseContent } from "../../../../lib/helpers"
import { renderToHTML } from "next/dist/server/render"
import _ from 'lodash'

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
    const tid: string = context.params.thread as string

    const uid: string = genUID(context.req as NextApiRequest,tid)

    const boardName: string = context.params.board as string

    const board: Board = await boardRepo.findById(boardName)
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

const CommentContext = createContext(null)


const PostContainer = ({board,getPost,hover,post,main}: {board: string,hover?: boolean,getPost?: (id: string) => Post,post: Post,main: boolean}) => {
    const [downloadurl,setdownloadurl] = useState<string | null>(null)
    const [metadata,setmetadata] = useState<FullMetadata | null>(null)
    const [expand,setexpand] = useState<boolean>(false)
    const [,setComment] = useContext(CommentContext)
    const imgref = useRef()
    const fileSize = useMemo(() => !metadata ? '0KB' : metadata.size > 1000000 ? `${Math.floor(metadata.size/1000000)}MB` : `${Math.floor(metadata.size/1000)}KB`,[metadata])

    const [showHoverPost,setShowHoverPost] = useState<string | null>(null)

    const addReplier = () => setComment(comment => comment + `>>${post.id}\r\n`)


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
        <div id={post.id} className={`${styles.postcontainer} ${hover ? styles.hovercontainer : ''} ${main ? styles.mainpostcontainer: ''}`}>
            <div className={styles.timestamp}>
                {main && (<span className={styles.title} style={{clear: expand ? 'both' : 'none'}}>
                    /{board}/ - {post.title}
                </span>)}
                <span>{post.poster.username == '' ? 'Anonymous' : post.poster.username}</span> 
                <span style={{margin:"0 .5rem"}}>(ID: {post.poster.uid})</span>
                <span>{`${moment(typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.seconds).utcOffset('GMT').format("DD/MM/YYYY(ddd)HH:mm:ss")}`}
                </span>
                <span onClick={addReplier} style={{cursor: 'pointer'}}>
                    No. {post.id}
                </span>
                <div className={styles.replies}>
                    {post.replies.map(r => (
                        <>
                            <a onMouseEnter={() => setShowHoverPost(r)} onMouseLeave={() => setShowHoverPost(null)} key={r} href={'#' + r} className={styles.postreply}>
                                {'>>'}{r}
                            </a>
                            {showHoverPost &&
                                <PostContainer board={board} post={getPost(r)} hover={true} main={false} />
                            }
                        </>
                    ))}
                </div>
            </div>
            <div className={styles.timestamp}>
            {post.image && imgref.current && metadata && (
                <span>File: <a target="_blank" rel="noreferrer" href={downloadurl}>{metadata.customMetadata['displayName']}</a> ({fileSize} {imgref.current['width']}x{imgref.current['height']})</span>
            )}
            </div>
            <div className={styles.content}>
                {post.image && (
                <div onClick={() => setexpand(expand => !expand)} className={styles.image}>
                    <img ref={imgref} style={{display: downloadurl ? 'initial' : 'none'}} src={downloadurl} alt="thumb" width={expand ? "100%" : main ? "250px" : "120px"}/>
                </div>)}
                
                <div dangerouslySetInnerHTML={{__html: parseContent(post.content)}} className={styles.text} style={{clear: expand ? 'both' : 'none'}}>
                </div>
            </div>
        </div>
    )
}

const PostReply = ({hide,board,tid} : {hide: () => void,board: string,tid: string}) => {
    const [showerr,setshowerr] = useState<string | null>(null)
    const [name,setname] = useState<string>("")
    const [file,setfile] = useState<File | null>(null)
    const [disablePost,setDisablePost] = useState<boolean>(false)
    const [comment,setComment] = useContext(CommentContext)

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
        setDisablePost(true)
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
            .then(async res => {
                const msg = await res.json()
                if(msg.message != 'ok'){
                    setshowerr(msg.reason)
                }
                else {
                    console.log('success')
                    setshowerr(null)
                    setComment("")
                    setname("")
                    setfile(null)
                    hide()
                }
                setDisablePost(false)
            })
            .catch(err => {
                console.error('error',err)
                setDisablePost(false)
                setshowerr(null)
            })
    }

    return (
        <div ref={topref} className={styles.reply}>
            <div ref={touchref} className={styles.touchreply}>
                Reply to Thread: No.{tid} 
                <button onClick={hide} style={{float:'right',cursor: 'pointer'}}>X</button>
            </div>
            <input value={name} onChange={ev => setname(ev.target.value)} className={styles.title} type="text" placeholder="Name" />
            <input className={styles.title} type="text" placeholder="Options" />
            <textarea autoFocus value={comment} onChange={ev => setComment(ev.target.value)} className={`${styles.title} ${styles.comment}`} placeholder="Comment" />
            <div style={{display:'flex',margin:0,justifySelf:"flex-end",justifyContent:'space-between',fontSize:"1.5rem",color:'grey'}}>
                <input onChange={ev => setfile(ev.target.files[0])} type="file" accept="image/jpeg, image/jpg, image/png" />
                <button disabled={disablePost} onClick={_.debounce(submit,1000)}>Post</button>
            </div>
            <div className={styles.error} style={{display: showerr ? 'inline-block':'none'}}>
                {showerr}
            </div>
        </div>
    )
}

export default function Page({data: {board,title,posts}}: {data: ThreadProps}){
    const [showreply,setshowreply] = useState<boolean>(false)
    const [postState,setPostState] = useState<Post[]>(posts.sort((a,b) => parseInt(a.id) - parseInt(b.id)))
    const [comment,setcomment] = useState<string>('')

    const setCommentWrap = comment => {
        setshowreply(true)
        setcomment(comment)
    }

    const getPost = useCallback(id => postState.find(p => p.id == id),[postState])

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
                    const data: Post = c.doc.data() as Post

                    switch(c.type){
                        case 'added':
                            setPostState((postState: Post[]) => ([...postState,data as Post]))
                            break;
                        case 'modified':
                            setPostState((posts: Post[]) =>
                                posts.map(p => p.id === data.id ? data : p)
                            )
                            break;
                        case 'removed':
                            setPostState((posts: Post[]) =>
                                posts.filter(p => p.id != data.id)
                            )
                    }
                })
        },error => console.error(error))

        return () => {
            unsub()
        }
    },[]);

    return (
        <Layout>
            <CommentContext.Provider value={[comment,setCommentWrap]}>
                <BoardTitle board={board}/>
                <div onClick={() => setshowreply(true)} className={styles.postreplybtn} style={{fontWeight:'bold',fontSize:'2.5rem'}}>
                    [Post a Reply]
                </div>
                <div className={styles.postcount}>
                    <div onClick={() => scrollTo({behavior:'smooth',top:document.body.scrollHeight})} className={styles.btns}>[Bottom]</div> 
                    <div onClick={() => Router.reload()} className={styles.btns}>[Refresh]</div> 
                    <span onClick={() => Router.push(`/boards/${board.id}`)} className={styles.btns} >[Catalog]</span> 
                    <span style={{marginLeft:'auto'}} className={styles.tooltip}>{postState.filter(p => p.image).length} <span className={styles.tooltiptext}>images</span></span> / 
                    <span className={styles.tooltip}>{postState.length} <span className={styles.tooltiptext}>posts</span></span> / 
                    <span className={styles.tooltip}>{diffPosters(postState)}<span className={styles.tooltiptext}>users</span></span>
                </div>
                {postState.map((p: Post,index: number) => (
                    <PostContainer key={p.id} {...({main: index === 0})} board={board.id} getPost={getPost} post={p} />
                ))}
                {showreply && <PostReply hide={() => setshowreply(false)} board={board.id} tid={postState[0].id} />}
                <div className={styles.postcount}>
                    <div onClick={() => setshowreply(true)} className={styles.postreplybtn}>[ post reply ]</div>
                    <div>{postState.length} / 0</div>
                </div>
            </CommentContext.Provider>
        </Layout>
    )
}