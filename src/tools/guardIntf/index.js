import { encode, decode}  from './base65536'
import { brotliDecompress,brotliDecompressSync } from "zlib"
import rq from "request-promise-native"


export default async function getGuardList(){
    let data = await rq({
        uri:"https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=465671",
        method:"get",
        json:true
    })
    let text = data.data.room_info.description;
    text = text.replace(/^<p>/,"").replace(/<\/p>$/,"").replace(/^b6/,"")
    const uint8Array2 = decode(text)
    const ori = brotliDecompressSync(uint8Array2.buffer).toString()
    return JSON.parse(ori)
}
