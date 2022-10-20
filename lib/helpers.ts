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

export function parseContent(content: string): string {
    const strcolor = content
        .replace(/&gt;&gt;\d+/g, match=> `<a style="color:blue" href="#${match.substring(8)}">>>${match.substring(8)}</a>`)
        .replace(/&gt;(?!&gt;).*\r\n/g,match => `<span style="color:green">${match}</span>`)
        .replaceAll("\r\n","<br />")

    return strcolor
}