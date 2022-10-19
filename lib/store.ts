import { configureStore, createSlice } from "@reduxjs/toolkit";

const boardListSlice = createSlice({
    name:"boards",
    initialState: {
        value: []
    },
    reducers: {
        setBoards(state,{payload}) {
            state.value = payload
        }
    }

})

export const loadBoardsStorage = () => {
    const item = sessionStorage.getItem('boards')
    if (!item)
        return null

    return JSON.parse(item)
}
export const saveBoardsStorage = boards => sessionStorage.setItem('boards',JSON.stringify(boards))

const store = configureStore({
    reducer: {
        boards: boardListSlice.reducer
    },
    devTools: true,
})

export const {setBoards} = boardListSlice.actions
export const selectBoardsState = state => state.boards.value

export default store