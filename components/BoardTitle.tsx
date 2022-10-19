import { BoardMetadata } from "../pages/_app"
import styles from '../styles/BoardTitle.module.css'

export default ({board} :{board: BoardMetadata}) => {

    return (
        <>
        <div className={styles.title}>
                /{board.id}/ - <span style={{textTransform:'capitalize'}}>{board.name}</span>
            </div>
        <div style={{borderBottom:"1px solid black",width:"90%"}}>
        </div>
</>
    )
}