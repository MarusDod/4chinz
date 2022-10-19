import { NextApiRequest, NextApiResponse } from "next"
import { boardRepo } from "../../lib/firebaseadmin"
import { BoardMetadata } from "../_app"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const boards: BoardMetadata[] = (await boardRepo.find()).map(b => ({
        id: b.id,
        name: b.name,
        category: b.category
      }))

      res.json(boards)

}

export default handler