import { NextApiRequest } from "next";
import { Md5 } from "ts-md5";

export function genUID(req: NextApiRequest,tid: string): string {
    const forwarded = req.headers['x-forwarded-for']
    console.log('forwarded',forwarded)
    console.log('req',req.socket.remoteAddress)
    const ip: string = typeof forwarded === 'string' ? forwarded.split(/, /)[0] : req.socket.remoteAddress;


    const uid: string = new Md5().appendStr(ip).appendStr(tid).end(false) as string

    const half = Math.floor(uid.length / 2)

    return uid.slice(0,half)
}