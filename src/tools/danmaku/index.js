import WebSocket from 'ws'
import EventEmitter from 'events'
import net from 'net'
import _ from 'lodash'

import DMDecoder from './decoder'
import DMEncoder from './encoder'

const DMPORT = 2243
const DMSERVER = 'livecmt-2.bilibili.com'

const WSDMPROTOCOL = 'ws'
const WSSDMPROTOCOL = 'wss'
const WSDMSERVER = 'broadcastlv.chat.bilibili.com'
const WSDMPORT = 2244
const WSSDMPORT = 2245
const WSDMPATH = 'sub'

const HEARTBEAT_DELAY = 1e4
const CHECK_ERROR_DELAY = 15e3

export default class DanmakuService extends EventEmitter {

  constructor(config = {}) {
    super()

    this.roomId = config.roomId || '23058'  // 此处需要使用原始房间号
    this.userId = config.userId || this.randUid()
    this.useWebsocket = config.useWebsocket === false ? false : true
    this.useWSS = config.useWSS || false
    this.useGiftBundle = config.useGiftBundle || false
    this.giftBundleDelay = config.giftBundleDelay || 3e3

    this._socket = null
    this._socketEvents = {
      connect: 'connect',
      data: 'data',
      close: 'close',
      error: 'error'
    }
    this._websocketEvents = {
      connect: 'open',
      data: 'message',
      close: 'close',
      error: 'error'
    }
    this._heartbeatService = null
    this._checkErrorService =  _.debounce(() => {
      this.emit('error', 'check failed')
      this.reconnect()
    }, CHECK_ERROR_DELAY)
    this._giftBundleMap = new Map()
  }

  randUid() {
    return 1E15 + Math.floor(2E15 * Math.random())
  }

  setUseGiftBundle(use) {
    this.useGiftBundle = use
  }

  connect() {
    if (this.useWebsocket) {
      if (this.useWSS) {
        this._socket = new WebSocket(`${WSSDMPROTOCOL}://${WSDMSERVER}:${WSSDMPORT}/${WSDMPATH}`)
      } else {
        this._socket = new WebSocket(`${WSDMPROTOCOL}://${WSDMSERVER}:${WSDMPORT}/${WSDMPATH}`)
      }
    } else {
      this._socket = net.connect(DMPORT, DMSERVER)
    }
    this.handleEvents()
  }

  disconnect() {
    clearTimeout(this._heartbeatService)
    this._checkErrorService.cancel()

    if (this.useWebsocket) {
      this._socket.close();
    } else {
      this._socket.end()
    }
    this._socket = null
  }

  reconnect() {
    this.disconnect()
    this.connect()
  }

  handleEvents() {
    let socket = this._socket
    let events = this._socketEvents
    if (this.useWebsocket) {
      events = this._websocketEvents
    }

    socket.on(events.connect, () => {
      if (socket !== this._socket) return
      this.sendJoinRoom()
      this.emit('connect')
    })

    socket.on(events.data, (msg) => {
      if (socket !== this._socket) return
      this._checkErrorService()
      DMDecoder.decodeData(msg).map(m => {
        if (m.type === 'connected') {
          this.sendHeartbeat()
          this.emit(m.type, m)
        } else {
          if (m.type === 'gift' && this.useGiftBundle) {
            this.bundleGift(m)
          } else {
            this.emit('data', m)
            this.emit(m.type, m)
          }
        }
      })
    })

    socket.on(events.close, () => {
      if (socket !== this._socket) return
      this.emit('close')
    })

    socket.on(events.error, (err) => {
      if (socket !== this._socket) return
      this.emit('error', err)
      this.reconnect()
    })
  }

  sendJoinRoom() {
    if (this.useWebsocket) {
      this._socket.send(DMEncoder.encodeJoinRoom(this.roomId, this.userId))
    } else {
      this._socket.write(DMEncoder.encodeJoinRoom(this.roomId, this.userId))
    }
  }

  sendHeartbeat() {
    if (this.useWebsocket) {
      this._socket.send(DMEncoder.encodeHeartbeat())
    } else {
      this._socket.write(DMEncoder.encodeHeartbeat())
    }
    this._heartbeatService = setTimeout(() => {
      this.sendHeartbeat()
    }, HEARTBEAT_DELAY)
  }

  bundleGift(msg) {
    let key = `${msg.user.id}.${msg.gift.id}`

    if (this._giftBundleMap.has(key)) {
      let giftEvent = this._giftBundleMap.get(key)
      giftEvent.msg.gift.count = giftEvent.msg.gift.count*1 + msg.gift.count*1
      giftEvent.event()
    } else {
      let giftEvent = {
        msg: _.merge({}, msg),
        event: _.debounce(() => {
          this.emit('data', giftEvent.msg)
          this.emit('gift', giftEvent.msg)
          this._giftBundleMap.delete(key)
        }, this.giftBundleDelay)
      }
      giftEvent.event()
      this._giftBundleMap.set(key, giftEvent)
    }
  }

}