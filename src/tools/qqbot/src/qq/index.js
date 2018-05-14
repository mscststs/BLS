'use strict';

const os = require('os');
// const Log = require('log');
const path = require('path');
const EventEmitter = require('events');

const URL = require('./url');
const Codec = require('../codec');
const Utils = require('../utils');
import Client from '../httpclient';
const MessageAgent = require('./message-agent');
const Headless = require('./headless');

// const log = global.log || new Log(process.env.LOG_LEVEL || 'info');
let log ={};
log.info = log.warning = log.debug = log.verbose =  console.log;

class QQ extends EventEmitter {
    static get LOGIN() {
        return {
            QR: 0,
            PWD: 1
        };
    }

    static get defaultOptions() {
        return {
            app: {
                clientid: 53999199,
                appid: 501004106,
                login: QQ.LOGIN.QR,
                maxSendRetry: 2,
                maxShortAllow: 3
            },
            auth: {
                u: '',
                p: ''
            },
            font: {
                name: '宋体',
                size: 10,
                style: [0, 0, 0],
                color: '000000'
            },
            cookiePath: path.join(os.tmpdir(), 'qq-bot.cookie'),
            qrcodePath: path.join(os.tmpdir(), 'qq-bot-code.png')
        };
    }

    /**
     * parse received object to standard option
     * 
     * @param {any} opt
     * @returns {QQ.defaultOptions}
     */
    static parseOptions(opt) {
        const dflt = QQ.defaultOptions;
        const app = Object.assign(dflt.app, opt.app);
        const auth = Object.assign(dflt.auth, opt.auth);
        const font = Object.assign(dflt.font, opt.font);
        if (app.login === QQ.LOGIN.PWD) {
            if (!auth.u || !auth.p) {
                throw new Error('auth.u and auth.p must be specificed when using pwd login mode.');
            }
        }
        return Object.assign(QQ.defaultOptions, opt, { app, auth, font });
    }

    constructor(options = {}) {
        super();
        this.options = QQ.parseOptions(options);
        this.tokens = {
            uin: '',
            ptwebqq: '',
            vfwebqq: '',
            psessionid: ''
        };
        this.selfInfo = {};
        this.buddy = {
            friends: [],
            marknames: [],
            categories: [],
            vipinfo: [],
            info: []
        };
        this.discu = [];
        this.group = [];
        this.client = new Client();
        this.messageAgent = null;
        // true if QQBot still online/trying to online
        this._alive = false;
    }

    async run() {
        try {
            console.log("尝试登录");
            await this.login();
            this._alive = true;
            log.info('开始获取帐号信息及联系人列表');
            await Promise.all([
                this.getBuddy(),
                this.getGroup(),
                this.getDiscu(),
                this.getSelfInfo(),
                this.getOnlineBuddies(),
                this.getRecentList()
            ]);
            await this.loopPoll();
        } catch (err) {
            if (err.message === 'disconnect') {
                this.emit('disconnect');
                log.info('尝试重新登录');
            } else if (err.message === 'cookie-expire') {
                this.emit('cookie-expire');
                log.info(`删除 Cookie 文件 ${this.options.cookiePath}`);
                await Utils.unlinkAsync(this.options.cookiePath);
            }
            return this.run();
        }
    }

    async login() {
        this.emit('login');
        console.log("登录流程开始");
        beforeGotVfwebqq: {
            // cookie file exists, try login with it
            console.log("开始检查cookies文件");
            if (await Utils.existAsync(this.options.cookiePath)) {
                const cookieFile = await Utils.readFileAsync(this.options.cookiePath, 'utf-8');
                const cookieText = cookieFile.toString();
                log.info('(-/5) 检测到 cookie 文件，尝试自动登录');
                this.emit('cookie-relogin');
                const ptwebqqMatch = cookieText.match(/ptwebqq=(.+?);/);
                // ptwebqq can be an empty string if login with id/pwd
                this.tokens.ptwebqq = ptwebqqMatch ? ptwebqqMatch[1] : '';
                this.client.setCookie(cookieText);
                // skip this label if found cookie, goto Step4
                break beforeGotVfwebqq;
            }
            console.log("开始检查option");
            // id/pwd login have a higher prioirty than QR Code login
            if (this.options.app.login === QQ.LOGIN.PWD) {
                let puppeteer;
                try {
                    puppeteer = require('puppeteer');
                } catch (err) {
                    log.warning(`要使用帐号密码登录，请先安装 puppeteer`);
                    log.info(`切换回二维码登录`);
                }
                if (puppeteer) {
                    log.info('(-/5) 帐号密码登录');
                    const tokens = await Headless.getTokens(this.options.auth.u, this.options.auth.p);
                    log.info('(-/5) 帐号密码验证成功');
                    this.client.setCookie(tokens.cookieStr);
                    // goto Step4
                    break beforeGotVfwebqq;
                }
            }
            // use QR Code login as fallback option
            log.info('(0/5) 二维码登录，准备下载二维码');

            // Step0: prepare cookies, pgv_info and pgv_pvid
            // http://pingjs.qq.com/tcss.ping.js  tcss.run & _cookie.init
            const initCookies = {
                pgv_info: `ssid=s${Codec.randPgv()}`,
                pgv_pvid: Codec.randPgv()
            };
            this.client.setCookie(initCookies);
            await this.client.get(URL.loginPrepare);

            // Step1: download QRcode
            let scanSuccess = false;
            let qrCodeExpired = true;
            let ptlogin4URL;  // Scan QR code to get this, useful in Step3
            const quotRegxp = /'[^,]*'/g;

            while (!scanSuccess) {

                const qrCode = await this.client.get({ url: URL.qrcode, responseType: 'arraybuffer' });
                await Utils.writeFileAsync(this.options.qrcodePath, qrCode, 'binary');
                qrCodeExpired = false;
                this.emit('qr', this.options.qrcodePath, qrCode);
                log.info(`(1/5) 二维码下载到 ${this.options.qrcodePath} ，等待扫描`);
                Utils.openFile(this.options.qrcodePath);
                const ptqrloginURL = URL.getPtqrloginURL(this.client.getCookie('qrsig'));

                // Step2: scan QRcode
                while (!scanSuccess && !qrCodeExpired) {
                    const responseBody = await this.client.get({
                        url: ptqrloginURL,
                        headers: { Referer: URL.loginPrepare },
                    });
                    log.debug(responseBody.trim());
                    const arr = responseBody.match(quotRegxp).map(i => i.substring(1, i.length - 1));
                    log.debug('JSONP result matched:\n', JSON.stringify(arr));
                    if (arr[0] === '0') {
                        scanSuccess = true;
                        ptlogin4URL = arr[2];
                    } else if (arr[0] === '65') {
                        qrCodeExpired = true;
                        this.emit('qr-expire');
                        log.info('(1/5) 二维码已失效，重新下载二维码');
                    } else if (arr[0] === '67') {
                        log.info('(1/5) 二维码已扫描，请在手机端确认登录');
                        await Utils.sleep(2000);
                        continue;
                    } await Utils.sleep(2000);
                }
            }
            log.info('(2/5) 二维码认证完成');
            Utils.unlinkAsync(this.options.qrcodePath);

            // Step3: find token 'ptwebqq' in cookie
            // NOTICE: the request returns 302 when success. DO NOT REJECT 302.
            await this.client.get({
                url: ptlogin4URL,
                maxRedirects: 0,     // Axios follows redirect automatically, but we need to disable it here.
                validateStatus: status => status === 302,
                headers: { Referer: URL.referer130916 }
            });
            this.tokens.ptwebqq = this.client.getCookie('ptwebqq');
            log.info('(3/5) 获取 ptwebqq 成功');
        } // ========== label 'beforeGotVfwebqq' ends here ==========

        // Step4: request token 'vfwebqq'
        const vfwebqqResp = await this.client.get({
            url: URL.getVfwebqqURL(this.tokens.ptwebqq),
            headers: { Referer: URL.referer130916 }
        });
        log.debug(vfwebqqResp);
        try {
            this.tokens.vfwebqq = vfwebqqResp.result.vfwebqq;
            log.info('(4/5) 获取 vfwebqq 成功');
        } catch (err) {
            log.info('(-/5) Cookie 已失效');
            throw new Error('cookie-expire');
        }
        // Step5: psessionid and uin
        const loginStat = await this.client.post({
            url: URL.login2,
            data: {
                ptwebqq: this.tokens.ptwebqq,
                clientid: this.options.app.clientid,
                psessionid: "",
                // TODO: online status
                status: "online",
            },
            headers: {
                Origin: URL.originD1,
                Referer: URL.referer151105
            }
        });
        log.debug(loginStat);
        this.tokens.uin = loginStat.result.uin;
        this.tokens.psessionid = loginStat.result.psessionid;
        this.messageAgent = new MessageAgent({
            font: this.options.font,
            clientid: this.options.app.clientid,
            psessionid: this.tokens.psessionid
        });
        log.info('(5/5) 获取 psessionid 和 uin 成功');
        const cookie = await this.client.getCookieString();
        Utils.writeFileAsync(this.options.cookiePath, cookie, 'utf-8').then(() => {
            log.info(`保存 Cookie 到 ${this.options.cookiePath}`);
        });
        this.emit('login-success', this.options.cookiePath, cookie);
    }

    async getSelfInfo() {
        const res = await this.client.get({
            url: URL.selfInfo,
            headers: { Referer: URL.referer130916 }
        });
        if (res.retcode === 0 && res.result) {
            this.selfInfo = res.result;
            return this.selfInfo;
        } else {
            log.warning('尝试获取用户信息时失败：', res);
            throw new Error('cookie-expire');
        }
    }

    async getBuddy() {
        const res = await this.client.post({
            url: URL.getBuddy,
            headers: { Referer: URL.referer130916 },
            data: {
                vfwebqq: this.tokens.vfwebqq,
                hash: Codec.hashU(this.tokens.uin, this.tokens.ptwebqq)
            }
        });
        if (res.retcode === 0 && res.result) {
            this.buddy = res.result;
            return this.buddy;
        } else {
            log.warning('尝试获取好友列表时失败：', res);
        }
    }

    async getOnlineBuddies() {
        const res = await this.client.get({
            url: URL.onlineBuddies(this.tokens.vfwebqq, this.tokens.psessionid),
            headers: { Referer: URL.referer151105 }
        });
        if (res.retcode === 0) {
            return res.result;
        } else {
            log.warning('尝试获取好友在线状态时失败：', res);
        }
    }

    async getRecentList() {
        const res = await this.client.post({
            url: URL.recentList,
            headers: { Referer: URL.referer151105 },
            data: {
                vfwebqq: this.tokens.vfwebqq,
                hash: Codec.hashU(this.tokens.uin, this.tokens.ptwebqq)
            }
        });
        if (res.retcode === 0) {
            return res.result;
        } else {
            log.warning('尝试获取最近联系人列表时失败：', res);
        }
    }

    async getGroup() {
        const res = await this.client.post({
            url: URL.getGroup,
            headers: { Referer: URL.referer130916 },
            data: {
                vfwebqq: this.tokens.vfwebqq,
                hash: Codec.hashU(this.tokens.uin, this.tokens.ptwebqq)
            }
        });
        if (res.retcode === 0 && res.result && res.result.gnamelist) {
            this.group = res.result.gnamelist;
            return this.group;
        } else {
            log.warning('尝试获取群列表时失败：', res);
        }
    }

    async getDiscu() {
        const res = await this.client.post({
            url: URL.getDiscu(this.tokens.vfwebqq, this.tokens.psessionid),
            headers: { Referer: URL.referer130916 },
            data: {
                vfwebqq: this.tokens.vfwebqq,
                hash: Codec.hashU(this.tokens.uin, this.tokens.ptwebqq)
            }
        });
        if (res.retcode === 0 && res.result && res.result.dnamelist) {
            this.discu = res.result.dnamelist;
            return this.discu;
        } else {
            log.warning('尝试获取讨论组列表时失败：', res);
        }
    }

    async getBuddyName(uin) {
        let mark = this.buddy.marknames.find(e => e.uin == uin);
        if (mark) return mark.markname;
        let info = this.buddy.info.find(e => e.uin == uin);
        if (!info) {
            await this.getBuddy();
            mark = this.buddy.marknames.find(e => e.uin == uin);
            if (mark) return mark.markname;
            info = this.buddy.info.find(e => e.uin == uin);
        }
        return info ? info.nick : uin;
    }

    async getDiscuName(did) {
        let discu = this.discu.find(e => e.did == did);
        if (!discu) {
            await this.getDiscu();
            discu = this.discu.find(e => e.did == did);
        }
        return discu ? discu.name : did;
    }

    async getDiscuInfo(did) {
        const res = await this.client.get({
            url: URL.discuInfo(did, this.tokens.psessionid, this.tokens.vfwebqq),
            headers: { Referer: URL.referer151105 }
        });
        if (res.retcode === 0 && res.result) {
            return res.result;
        } else {
            log.warning('尝试获取讨论组信息时失败：', res);
        }
    }

    async getNameInDiscu(uin, did) {
        let discu = this.discu.find(g => did == g.did);
        if (!discu) {
            await this.getDiscu();
            discu = this.discu.find(g => did == g.did);
            if (!discu) throw new Error(`[getNameInDiscu] No such discu ${did}`);
        }
        if (!discu.info) {
            discu.info = await this.getDiscuInfo(did);
            if (!discu.info) return uin;
        }
        const minfo = discu.info.mem_info.find(i => i.uin == uin);
        if (minfo) return minfo.nick;
        return uin; // uin not found. may self or newly added member
    }

    async getGroupName(gIdOrCode) {
        let group = this.group.find(g => gIdOrCode == g.gid || gIdOrCode == g.code);
        if (!group) {
            await this.getGroup();
            group = this.group.find(g => gIdOrCode == g.gid || gIdOrCode == g.code);
        }
        return group ? group.name : gIdOrCode;
    }

    async getGroupInfo(code) {
        const res = await this.client.get({
            url: URL.groupInfo(code, this.tokens.vfwebqq),
            headers: { Referer: URL.referer130916 }
        });
        if (res.retcode === 0 && res.result) {
            return res.result;
        } else {
            log.warning('尝试获取群信息时失败：', res);
        }
    }

    async getNameInGroup(uin, gIdOrCode) {
        let group = this.group.find(g => gIdOrCode == g.gid || gIdOrCode == g.code);
        if (!group) {
            await this.getGroup();
            group = this.group.find(g => gIdOrCode == g.gid || gIdOrCode == g.code);
            if (!group) throw new Error(`[getNameInGroup] No such group ${gIdOrCode}`);
        }
        if (!group.info) {
            group.info = await this.getGroupInfo(group.code);
            if (!group.info) return uin;
        }
        const card = group.info.cards.find(i => i.muin == uin);
        if (card) {
            return card.card;
        }
        let minfo = group.info.minfo.find(i => i.uin == uin);
        if (!minfo) {
            group.info = await this.getGroupInfo(group.code);
            minfo = group.info.minfo.find(i => i.uin == uin);
        }
        if (minfo) return minfo.nick;
        return uin; // uin not found. may self or newly added member
    }

    logMessage(msg, msgParsed) {
        switch (msg.poll_type) {
            case 'message':
                log.info(`[${msgParsed.name}] ${msgParsed.content}`);
                break;
            case 'group_message':
                log.info(`[${msgParsed.groupName}.${msgParsed.name}] ${msgParsed.content}`);
                break;
            case 'discu_message':
                log.info(`[${msgParsed.discuName}.${msgParsed.name}] ${msgParsed.content}`);
                break;
            default:
                log.notice(`未知消息类型 ${msg.poll_type}:\n${JSON.stringify(msg, null, 2)}`);
                break;
        }
    }

    async handleMsgRecv(pollBody) {
        // msg.result may have more than one members; but I've never seen that
        for (let msg of pollBody.result) {
            const content = msg.value.content.filter(e => typeof e == 'string').join(' ').trim();
            const { value: { from_uin, send_uin }, poll_type } = msg;
            let msgParsed = { content };
            // do not handle messages sent by self
            if (send_uin === this.tokens.uin) continue;
            switch (poll_type) {
                case 'message':
                    msgParsed.type = 'buddy';
                    msgParsed.id = from_uin;
                    msgParsed.name = await this.getBuddyName(from_uin);
                    break;
                case 'group_message':
                    msgParsed.type = 'group';
                    msgParsed.id = send_uin;
                    msgParsed.name = await this.getNameInGroup(send_uin, from_uin);
                    msgParsed.groupId = from_uin;
                    msgParsed.groupName = await this.getGroupName(from_uin);
                    break;
                case 'discu_message':
                    msgParsed.type = 'discu';
                    msgParsed.id = send_uin;
                    msgParsed.name = await this.getNameInDiscu(send_uin, from_uin);
                    msgParsed.discuId = from_uin;
                    msgParsed.discuName = await this.getDiscuName(from_uin);
                    break;
                default:
                    break;
            }
            this.logMessage(msg, msgParsed);
            this.emit('msg', msgParsed, pollBody);
            this.emit(msgParsed.type, msgParsed, pollBody);
        }
    }

    async loopPoll() {
        this.emit('start-poll');
        log.info('开始接收消息...');
        // poll that returns 502
        let failCnt = 0;
        // poll that less than 1s and dose not contain vaild msg
        let shortCnt = 0;
        let lastPollTime = -1;
        do {
            // check if still alive before polling
            if (!this._alive) {
                log.info('连接已断开，停止轮询');
                throw new Error('disconnect');
            }
            lastPollTime = Date.now();
            let pollBody;
            try {
                pollBody = await this.client.post({
                    url: URL.poll,
                    data: {
                        ptwebqq: this.tokens.ptwebqq,
                        clientid: this.options.app.clientid,
                        psessionid: this.tokens.psessionid,
                        key: ''
                    },
                    headers: {
                        Origin: URL.originD1,
                        Referer: URL.referer151105
                    },
                    responseType: 'text',
                    validateStatus: status => status === 200 || status === 504
                });
                this.emit('polling', pollBody);
                if (failCnt > 0) failCnt = 0;
            } catch (err) {
                log.warning('[loopPoll] Request Failed: ', err);
                if (err.response && err.response.status === 502)
                    log.warning(`出现 502 错误 ${++failCnt} 次，正在重试`);
                if (failCnt > 10) {
                    log.warning(`服务器 502 错误达到 ${failCnt} 次，断开连接`);
                    // set this._alive to false and enter next loop
                    // before next polling, it would throw Error('disconnect')
                    this._alive = false;
                }
                // there is no response to handle, just continue
                continue;
            }
            const now = Date.now();
            const pollTime = now - lastPollTime;
            log.debug(`pollTime: ${pollTime}ms`);
            log.debug(JSON.stringify(pollBody, null, 2));
            switch (pollBody.retcode) {
                case 0:
                    if (pollBody.result) {
                        try {
                            this.handleMsgRecv(pollBody);
                        } catch (err) {
                            log.error(`Error when handling msg:\n${JSON.stringify(pollBody)}\n${err}`);
                            this.emit('error', err);
                        }
                    } else {
                        if (pollTime <= 3000) {
                            log.warning(`本次轮询只有 ${pollTime}ms ，疑似无效\n${JSON.stringify(pollBody)}`);
                            shortCnt++;
                        }
                        if (shortCnt >= this.options.app.maxShortAllow) {
                            log.warning(`无效轮询达到 ${shortCnt} 次，断开连接`);
                            this._alive = false;
                            shortCnt = 0;
                            continue;
                        }
                    }
                    break;
                case 103:
                    await this.getOnlineBuddies();
                    break;
                case 100000: // "login domain error"
                case 100001:
                    log.info('登录状态失效');
                    this._alive = false;
                    break;
                case 100012: // eslint-disable-line no-case-declarations
                    // this case maybe deprecated
                    const match = /cost\[(\d+\.\d+s)\]$/.exec(pollBody.retmsg);
                    log.info(`在过去的${match ? ` ${match[1]} ` : '一段时间'}内没有收到消息`);
                    break;
                default:
                    log.notice(`未知的 retcode: ${pollBody.retcode}\n${JSON.stringify(pollBody, null, 2)}`);
                    break;
            }
        } while (true); // eslint-disable-line no-constant-condition
    }

    async innerSendMsg(url, type, id, content, tryCount = 0) {
        const res = await this.client.post({
            url,
            data: this.messageAgent.build(type, id, content),
            headers: { Referer: URL.refererc151105 }
        });
        log.debug(res);
        if (res.retcode === 0) {
            this.emit('send', res, { type, id, content });
            // send-buddy, send-discu, send-group
            this.emit(`send-${type}`, res, { type, id, content });
        } else {
            if (tryCount < this.options.app.sendMaxRetry) {
                log.warning(`发送失败：retcode=${res.retcode}, type=${type}, id=${id} 。重试 ${++tryCount} 次`);
                return await this.innerSendMsg(url, type, id, content, tryCount);
            } else {
                log.warning(`发送失败 ${++tryCount} 次。retcode=${res.retcode}, type=${type}, id=${id}`);
                return false;
            }
        }
        return true;
    }

    async sendBuddyMsg(uin, content) {
        const res = await this.innerSendMsg(URL.buddyMsg, 'buddy', uin, content);
        if (res) log.info(`=> [${await this.getBuddyName(uin)}] ${content}`);
        return res;
    }

    async sendDiscuMsg(did, content) {
        const res = await this.innerSendMsg(URL.discuMsg, 'discu', did, content);
        if (res) log.info(`=> [${await this.getDiscuName(did)}] ${content}`);
        return res;
    }

    async sendGroupMsg(gid, content) {
        const res = await this.innerSendMsg(URL.groupMsg, 'group', gid, content);
        if (res) log.info(`=> [${await this.getGroupName(gid)}] ${content}`);
        return res;
    }
}

export default QQ;
