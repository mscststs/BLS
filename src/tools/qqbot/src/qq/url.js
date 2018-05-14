'use strict';

const Codec = require('../codec');

const bknHash = function (skey, init_str = 5381) {
    let hash_str = init_str;
    skey.split('').forEach(ch => {
        hash_str += (hash_str << 5) + ch.charCodeAt();
    });
    hash_str = hash_str & 2147483647;
    return hash_str;
};

export default {
    loginPrepare: 'https://ui.ptlogin2.qq.com/cgi-bin/login?daid=164&target=self&style=16&mibao_css=m_webqq&appid=501004106&enable_qlogin=0&no_verifyimg=1&s_url=http%3A%2F%2Fw.qq.com%2Fproxy.html&f_url=loginerroralert&strong_login=1&login_state=10&t=20131024001',
    get qrcode() {
        return `https://ssl.ptlogin2.qq.com/ptqrshow?appid=501004106&e=0&l=M&s=5&d=72&v=4&t=${Date.now()}`;
    },
    getPtqrloginURL(qrsig) {
        const decoded = Codec.decodeQrsig(qrsig);
        return `https://ssl.ptlogin2.qq.com/ptqrlogin?ptqrtoken=${decoded}&webqq_type=10&remember_uin=1&login2qq=1&aid=501004106&u1=http%3A%2F%2Fw.qq.com%2Fproxy.html%3Flogin2qq%3D1%26webqq_type%3D10&ptredirect=0&ptlang=2052&daid=164&from_ui=1&pttype=1&dumy=&fp=loginerroralert&action=0-0-123332&mibao_css=m_webqq&t=undefined&g=1&js_type=0&js_ver=10141&login_sig=&pt_randsalt=0`;
    },
    getVfwebqqURL: ptwebqq => `https://s.web2.qq.com/api/getvfwebqq?ptwebqq=${ptwebqq}&clientid=53999199&psessionid=&t=${Date.now()}`,
    login2: 'https://d1.web2.qq.com/channel/login2',
    originD1: 'https://d1.web2.qq.com',
    originS2: 'https://s.web2.qq.com',
    referer151105: 'https://d1.web2.qq.com/proxy.html?v=20151105001&callback=1&id=2',
    refererc151105: 'https://d1.web2.qq.com/cfproxy.html?v=20151105001&callback=1',
    referer130916: 'https://s.web2.qq.com/proxy.html?v=20130916001&callback=1&id=1',
    recentList: 'https://d1.web2.qq.com/channel/get_recent_list2',
    selfInfo: `https://s.web2.qq.com/api/get_self_info2?t=${Date.now()}`,
    poll: 'https://d1.web2.qq.com/channel/poll2',
    buddyMsg: 'https://d1.web2.qq.com/channel/send_buddy_msg2',
    groupMsg: 'https://d1.web2.qq.com/channel/send_qun_msg2',
    discuMsg: 'https://d1.web2.qq.com/channel/send_discu_msg2',
    getBuddy: 'https://s.web2.qq.com/api/get_user_friends2',
    onlineBuddies: (vfwebqq, psessionid) => `https://d1.web2.qq.com/channel/get_online_buddies2?vfwebqq=${vfwebqq}&clientid=53999199&psessionid=${psessionid}&t=${Date.now()}`,
    buddyInfo: (uin, vfwebqq, psessionid) => `https://s.web2.qq.com/api/get_friend_info2?tuin=${uin}&vfwebqq=${vfwebqq}&clientid=53999199&psessionid=${psessionid}&t=${Date.now()}`,
    buddyQQID: (uin, vfwebqq) => `https://s.web2.qq.com/api/get_friend_uin2?tuid=${uin}&type=1&vfwebqq=${vfwebqq}&t=${Date.now()}`,
    getDiscu: (vfwebqq, psessionid) => `https://s.web2.qq.com/api/get_discus_list?clientid=53999199&psessionid=${psessionid}&vfwebqq=${vfwebqq}&t=${Date.now()}`,
    discuInfo: (discuss_id, psessionid, vfwebqq) => `https://d1.web2.qq.com/channel/get_discu_info?did=${discuss_id}&psessionid=${psessionid}&vfwebqq=${vfwebqq}&clientid=53999199&t=${Date.now()}`,
    getGroup: 'https://s.web2.qq.com/api/get_group_name_list_mask2',
    groupInfo: (group_code, vfwebqq) => `https://s.web2.qq.com/api/get_group_info_ext2?gcode=${group_code}&vfwebqq=${vfwebqq}&t=${Date.now()}`,
    // 获取好友qq号码
    buddyGroupInfo: (skey) => `https://qun.qq.com/cgi-bin/qun_mgr/get_friend_list?bkn=${bknHash(skey)}`,
    refererQun: 'https://qun.qq.com/member.html'
};
