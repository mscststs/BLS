import Consts from './consts.js'
import { StringDecoder } from 'string_decoder'

const textDecoder = new StringDecoder('utf8')

function decodeBuffer (buff) {
  let data = {}
  data.packetLen = buff.readInt32BE(Consts.WS_PACKAGE_OFFSET)
  Consts.dataStruct.forEach((struct) => {
    if (struct.bytes === 4) {
      data[struct.key] = buff.readInt32BE(struct.offset)
    } else if (struct.bytes === 2) {
      data[struct.key] = buff.readInt16BE(struct.offset)
    }
  })
  if (data.op && data.op === Consts.WS_OP_MESSAGE) {
    data.body = []
    let packetLen = data.packetLen
    let headerLen = 0
    for (let offset = Consts.WS_PACKAGE_OFFSET; offset < buff.byteLength; offset += packetLen) {
      packetLen = buff.readInt32BE(offset)
      headerLen = buff.readInt16BE(offset + Consts.WS_HEADER_OFFSET)
      try {
        let body = JSON.parse(textDecoder.write(buff.slice(offset + headerLen, offset + packetLen)))
        data.body.push(body)
      } catch (e) {
        console.log("decode body error:", textDecoder.write(buff.slice(offset + headerLen, offset + packetLen)), data)
      }
    }
  } else if (data.op && data.op === Consts.WS_OP_HEARTBEAT_REPLY) {
    data.body = {
      number: buff.readInt32BE(Consts.WS_PACKAGE_HEADER_TOTAL_LENGTH)
    }
  }
  return data
}

function parseMessage (msg) {
  switch (msg.op) {
    case Consts.WS_OP_HEARTBEAT_REPLY:
      msg.body.type = 'online'
      msg.body.ts = new Date().getTime()
      return msg.body
    case Consts.WS_OP_MESSAGE:
      return msg.body.map((m) => {
        return transformMessage(m)
      })
    case Consts.WS_OP_CONNECT_SUCCESS:
      return {
        type: 'connected',
        ts: new Date().getTime()
      }
  }
}

function transformMessage (msg) {
  let message = {}
  switch (msg.cmd) {
    case 'LIVE':
      message.type = 'live'
      message.roomId = msg.roomid
      break
    case 'PREPARING':
      message.type = 'preparing'
      message.roomId = msg.roomid
      break
    case 'DANMU_MSG':
      message.type = 'comment'
      message.comment = msg.info[1]
      message.user = {
        id: msg.info[2][0],
        name: msg.info[2][1],
        isAdmin: !!msg.info[2][2],
        isVIP: !!msg.info[2][3],
        isSVIP: !!msg.info[2][4],
        guard: msg.info[7]
      }
      if (msg.info[3].length) {
        message.user.medal = {
          level: msg.info[3][0],
          title: msg.info[3][1],
          anchor: msg.info[3][2],
          roomURL: msg.info[3][3]
        }
      }
      if (msg.info[4].length) {
        message.user.level = msg.info[4][0]
      }
      if (msg.info[5].length) {
        message.user.title = {
          name: msg.info[5][0],
          source: msg.info[5][1]
        }
      }
      break
    case 'WELCOME':
      message.type = 'welcome'
      message.user = {
        id: msg.data.uid,
        name: msg.data.uname,
        isAdmin: !!msg.data.isadmin,
        isVIP: !!msg.data.vip,
        isSVIP: !!msg.data.svip
      }
      break
    case 'WELCOME_GUARD':
      message.type = 'welcomeGuard'
      message.user = {
        id: msg.data.uid,
        name: msg.data.username,
        guard: msg.data.guard_level
      }
      break
    case 'GUARD_BUY':
      message.type = 'guardBuy'
      message.user = {
        id: msg.data.uid,
        name: msg.data.username
      }
      message.level = msg.data.guard_level
      message.count = msg.data.num
      break
    case 'SEND_GIFT':
      message.type = 'gift'
      message.gift = {
        id: msg.data.giftId,
        type: msg.data.giftType,
        name: msg.data.giftName,
        count: msg.data.num,
        price: msg.data.price
      }
      message.user = {
        id: msg.data.uid,
        name: msg.data.uname
      }
      break
    case 'ROOM_BLOCK_MSG':
      message.type = 'block'
      message.user = {
        id: msg.uid,
        name: msg.uname
      }
      break
    default:
      message = msg
      message.type = msg.cmd
  }
  message.ts = new Date().getTime()
  return message
}

function decodeData (buff) {
  let messages = []
  try {
    let data = parseMessage(decodeBuffer(buff))
    if (data instanceof Array) {
      data.forEach((m) => {
        messages.push(m)
      })
    } else if (data instanceof Object) {
      messages.push(data)
    }
  } catch (e) {
    console.log("Socket message error", buff, e)
  }
  return messages
}

export default {
  decodeData
}