import styles from '../styles/Layout.module.css'
import Link from 'next/link'
import { Fragment, ReactNode, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loadBoardsStorage, saveBoardsStorage, selectBoardsState, setBoards } from '../lib/store'
import { BoardMetadata } from '../pages/_app'

const NavBoard = ({boards,style}: {boards: BoardMetadata[],style?: any}) => {
    return (
        <div className={styles.nav} style={style ?? {}}>
            <div>{'[ '} {boards.map((b,index) => 
                (<>
                    {index === 0 ? '':' / '} 
                    <span className={styles.navitem} key={b.id}>
                        <Link href={`/boards/${b.id}`}>{b.id}</Link>
                    </span>
                </>))}
                {' ]'}
            </div>
            
            <a className={styles.navitem} href="/" style={{marginLeft:'auto',justifySelf:'flex-end'}}>{'[Home]'}</a>
        </div>
    )
}

type LayoutProps = {
    children?: ReactNode,
    boards: string[],
}

export const useBoards = (): BoardMetadata[] => {
    const boards: BoardMetadata[] = useSelector(selectBoardsState)
    const dispatch = useDispatch()

    useEffect(() => {
        if(boards.length !== 0)
            return

        const item = loadBoardsStorage()
        if(item){
            dispatch(setBoards(boards))
        }

        fetch('/api/boards')
            .then(async res => {
                const data = await res.json()
                console.log(data)
                dispatch(setBoards(data))
                saveBoardsStorage(data)
            })
            .catch(err => console.error(err))
    },[])

    return boards
}

export default ({children}) => {
    const boards = useBoards()

    return (
        <main className={styles.main}>
            <NavBoard boards={boards} />
            {children}
            <NavBoard boards={boards} style={{marginTop:"100px"}} />
        </main>
    )
}