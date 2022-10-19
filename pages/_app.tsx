import '../styles/globals.css'
import {Provider} from 'react-redux'
import {createWrapper} from 'next-redux-wrapper'
import store, { loadBoardsStorage, setBoards } from '../lib/store'
import { Board, ID } from '../lib/models'
import { GetServerSideProps } from 'next'
import { boardRepo } from '../lib/firebaseadmin'
import { ElementType, ReactNode } from 'react'
import { AppContext } from 'next/app'

export type BoardMetadata = {
  id: ID,
  name: string,
  category: string,
}

function MyApp({ Component, pageProps }: {Component: ElementType,pageProps}) {
  const {store: wrappedstore} = createWrapper(() => store).useWrappedStore({})

  return (
    <Provider store={wrappedstore}>
      <Component {...pageProps} />
    </Provider>)
}

export default MyApp