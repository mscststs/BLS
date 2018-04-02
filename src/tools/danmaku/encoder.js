import Consts from './consts.js'

function getPacketLength (payload) {
  return Buffer.byteLength(payload) + Consts.headerLength
}

function writePacketLength (buff, packetLength) {
  buff.writeInt32BE(packetLength, 0)
}

function writeConsts (buff) {
  buff.writeInt16BE(Consts.magic, 4)
  buff.writeInt16BE(Consts.version, 6)
  buff.writeInt32BE(Consts.magicParam, 12)
}

function writeAction (buff, action) {
  buff.writeInt32BE(action, 8)
}

function writePayload (buff, payload) {
  buff.write(payload, Consts.headerLength)
}

function generatePacket (action, payload) {
  payload = payload || ''
  let packetLength = getPacketLength(payload)
  let buff = new Buffer(packetLength)

  writePacketLength(buff, packetLength)
  writeConsts(buff)
  writeAction(buff, action)
  writePayload(buff, payload)

  return buff
}

function encodeHeartbeat () {
  return generatePacket(Consts.actions.heartbeat)
}

function encodeJoinRoom (rid, uid) {
  let userId = Number(uid)
  let roomId = Number(rid)
  let packet = JSON.stringify({uid: userId, roomid: roomId})
  return generatePacket(Consts.actions.joinChannel, packet)
}

export default {
  encodeJoinRoom,
  encodeHeartbeat,
}