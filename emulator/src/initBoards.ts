import { getRepository } from "fireorm"
import { firestore,storage } from "./init"
import {Board, Post, Thread} from './models'

const boards = [
    {
        id: 'g',
        name: 'technology',
        category: "interests"
    },
    {
        id: 'o',
        name: 'auto',
        category: "interests"
    },
    {
        id: 'lit',
        name: 'literature',
        category: "interests"
    },
    {
        id: 'biz',
        name: 'business',
        category: "other"
    },
    {
        id: 'x',
        name: 'paranormal',
        category: "other"
    },
    {
        id: 'b',
        name: 'random',
        category: "other"
    },
    {
        id: 'fit',
        name: 'fitness',
        category: "other"
    },
    {
        id: 'a',
        name: 'anime',
        category: "weebshit"
    },
    {
        id: 'pol',
        name: 'politically correct',
        category: "politics"
    },
]

const boardRepo = getRepository(Board);

(async () => {
    boards.forEach((board: Board) => {
        const newboard = new Board()
        newboard.category = board.category
        newboard.id = board.id
        newboard.name = board.name
        boardRepo.create(newboard)
    })
})()

firestore.collection('variables').doc('counter').set({value: 0})