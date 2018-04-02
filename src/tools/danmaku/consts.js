const WS_OP_HEARTBEAT = 2
const WS_OP_HEARTBEAT_REPLY = 3
const WS_OP_MESSAGE = 5
const WS_OP_USER_AUTHENTICATION = 7
const WS_OP_CONNECT_SUCCESS = 8
const GIFT_SYS_GIFT = 0
const GIFT_SYS_LUCKY_MONEY = 1
const GIFT_SYS_TV = 2
const GIFT_SYS_ANNOUNCEMENT = 3
const GIFT_SYS_GUARD = 4
const GIFT_SYS_ACTIVITY_RED_PACKET = 6
const WS_PACKAGE_OFFSET = 0
const WS_HEADER_OFFSET = 4
const WS_VERSION_OFFSET = 6
const WS_OPERATION_OFFSET = 8
const WS_SEQUENCE_OFFSET = 12
const WS_PACKAGE_HEADER_TOTAL_LENGTH = 16
const WS_HEADER_DEFAULT_VERSION = 1
const WS_HEADER_DEFAULT_OPERATION = 1
const WS_HEADER_DEFAULT_SEQUENCE = 1

export default {
  version: 1,
  magic: 16,
  magicParam: 1,
  headerLength: 16,
  actions: {
    heartbeat: 2,
    joinChannel: 7,
  },
  WS_OP_HEARTBEAT,
  WS_OP_HEARTBEAT_REPLY,
  WS_OP_MESSAGE,
  WS_OP_USER_AUTHENTICATION,
  WS_OP_CONNECT_SUCCESS,
  WS_PACKAGE_OFFSET,
  WS_HEADER_OFFSET,
  WS_VERSION_OFFSET,
  WS_OPERATION_OFFSET,
  WS_SEQUENCE_OFFSET,
  WS_PACKAGE_HEADER_TOTAL_LENGTH,
  WS_HEADER_DEFAULT_VERSION,
  WS_HEADER_DEFAULT_OPERATION,
  WS_HEADER_DEFAULT_SEQUENCE,
  dataStruct: [{
      name: "Header Length",
      key: "headerLen",
      bytes: 2,
      offset: WS_HEADER_OFFSET,
      value: WS_PACKAGE_HEADER_TOTAL_LENGTH
  }, {
      name: "Protocol Version",
      key: "ver",
      bytes: 2,
      offset: WS_VERSION_OFFSET,
      value: WS_HEADER_DEFAULT_VERSION
  }, {
      name: "Operation",
      key: "op",
      bytes: 4,
      offset: WS_OPERATION_OFFSET,
      value: WS_HEADER_DEFAULT_OPERATION
  }, {
      name: "Sequence Id",
      key: "seq",
      bytes: 4,
      offset: WS_SEQUENCE_OFFSET,
      value: WS_HEADER_DEFAULT_SEQUENCE
  }]
}