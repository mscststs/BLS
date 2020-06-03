import { encode, decode}  from './base65536'
import { brotliDecompress,brotliDecompressSync } from "zlib"
import rq from "request-promise-native"


async function getGuardList(){
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

async function getGuardListByUrl(urlConfig,uid=100000){
    let [url,parse] = urlConfig.split("|")
    try{
        let res = await rq({
            uri:url,
            method:"get",
            timeout:10000,
            headers:{
                "User-Agent":`bilibili-live-tools/${uid}`
            },
            json:true,
            gzip:true,
        })
        let target = res
        if(parse){
            parse.split(".").forEach(key=>{
                target = target[key]
                console.log(target,key)
            })
        }
        return target
    }catch(e){
        return []
    }
}

export default async function(urlConfig,uid){
    let [i,j] = await Promise.all([
        getGuardList(),
        urlConfig?getGuardListByUrl(urlConfig,uid):[]
    ])
    return [...i,...j]
}