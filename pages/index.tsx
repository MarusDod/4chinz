import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { GetServerSideProps } from 'next'
import { boardRepo } from '../lib/firebaseadmin'
import { Board, ID } from '../lib/models'
import { useDispatch, useSelector } from 'react-redux'
import { selectBoardsState, setBoards } from '../lib/store'
import { BoardMetadata } from './_app'
import { useBoards } from '../components/Layout'
import React from 'react'

const groupBy = <Key extends string,>(data: {[P in Key]: any}[],key: Key):any => {
  return data.reduce((acc: any, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item);
    return acc;
  }, {});
};

export default function Home() {
  const boards: BoardMetadata[] = useBoards()

  const gboards = groupBy(boards,"category")
  console.log("boards",gboards)

  return (
    <main className={styles.main}>
        <img 
          src={"/static/logo-transparent.png"} 
        />
      <div className={styles.boards}>
        <div className={styles.title}>
          What is this?
        </div>
        <div style={{margin:'1rem'}}>
          4chan with no jews and jannies. seethe cope and, above all, dilate
        </div>
      </div>
      <div className={styles.boards}>
        <div className={styles.title}>
          Boards
        </div>
        <div className={styles.content}>
          {Object.entries(gboards).map(([cat,l]) => (
            <React.Fragment key={cat}>
              <div className={styles.board}>
                {cat}
              </div>
              {(l as [BoardMetadata]).map(b => (
                <a key={b.id} href={`/boards/${b.id}`}>
                  {b.id}
                </a>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </main>

  )
}
