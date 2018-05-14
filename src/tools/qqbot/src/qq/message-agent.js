'use strict';

class MessageAgent {
    constructor(options) {
        const { clientid, psessionid, font } = options;
        this.t = (function () {
            var t = (new Date()).getTime();
            t = (t - t % 1000) / 1000;
            t = t % 10000 * 10000;
            return t;
        })();
        this.sequence = 0;
        this.clientid = clientid || 53999199;
        this.psessionid = psessionid;
        this.font = font || {
            name: '宋体',
            size: 10,
            style: [0, 0, 0],
            color: '000000'
        };
    }

    get msgId() {
        this.sequence++;
        return this.t + this.sequence;
    }

    get defaultMsg() {
        return {
            face: 537,
            clientid: this.clientid,
            msg_id: this.msgId,
            psessionid: this.psessionid
        };
    }

    build(typeOrKeyType, id, content) {
        let msg = {};
        switch (typeOrKeyType) {
            case 'buddy':
            case 'to':
                msg.to = id;
                break;
            case 'group':
            case 'group_uin':
                msg.group_uin = id;
                break;
            case 'discu':
            case 'did':
                msg.did = id;
                break;
            default:
                throw new Error(`Unknown msg type '${typeOrKeyType}'`);
        }
        msg.content = JSON.stringify([
            content, ['font', this.font]
        ]);
        msg = Object.assign(msg, this.defaultMsg);
        return msg;
    }
}

export default MessageAgent;
