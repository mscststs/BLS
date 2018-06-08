import rq from "request-promise-native"
import crypto from "crypto"
import api from "./api.js"
import eve from "./events"


class user {
    constructor(id, password,store={},name="new User") {
        /* init some static string */
        this.BASE = {
            actionKey: "appkey",
            platform: "android",
            _secretKey: "560c52ccd288fed045859ed18bffd973",
            appKey: "1d8b6e7d45233436",
            build: "521200",
            mobiApp: "android",
        };


        /* Global */
        this.config = {};//为configCenter准备的插槽，这样其他的组件可以直接使用user.config.xxx而不会报错了
        this.name = name;
        this.store = store;
        this.id = id;
        this.password = password;
        this._jar = rq.jar();
        this._headers = {
            'Connection': 'Keep-Alive',
            'Device-ID': 'Pwc3BzUCYwJjUWAGegZ6',
            'User-Agent': 'Mozilla/5.0 BiliDroid/5.22.0 (bbcallen@gmail.com)',
        };
    }
    Hash(algorithm, data) {
        return crypto.createHash(algorithm).update(data).digest('hex');
    }


    SignWithBasicQuery(data={},ts = true){
        let base= this.BASE;
        data.actionKey = base.actionKey;
        data.appkey = base.appKey;
        data.build = base.build;
        data.mobi_app = base.mobiApp;
        data.platform = base.platform;
        return this.SignParams(data,ts);
    }
    /* 签名算法 */
    SignParams(data, ts = true) {
        /* 获取sign之后的参数 */
        if (ts) {
            data.ts = Math.floor(Date.now() / 1000);
        }
        let s = [];
        for (let it in data) {
            s.push({
                key: it,
                value: data[it],
            });
        }
        function ss(a,b,cha = 0){
            let res = a.key.charCodeAt(cha)-b.key.charCodeAt(cha);
            if(res!==0){
                return res;
            }else{
                return ss(a,b,cha+1);
            }
        }
        s.sort(ss); //参数排序

        let ret = '';
        for (let i of s) {
            ret += encodeURIComponent(i.key) + '=' + encodeURIComponent(i.value) + '&';
        }
        ret = ret.substr(0, ret.length - 1); //去除末尾的&

        let paramsHash = this.Hash('md5', ret + this.BASE._secretKey);
        data["sign"] = paramsHash;
        return data;
    }

    async getGVID() {
        /* 获取GVID ,这一步讲道理用处不大，用于绕过UV统计系统中潜在的监测风险 */
        return api.origin({
            uri: `https://data.bilibili.com/gv/`,
            method: "get",
            jar: this._jar,
            headers: this._headers,
        }).then((res) => {
            // console.log(res);
            this._headers["Buvid"] = res;
        });
    }
    async getPublickey() {
        let base = this.BASE;
        return api.origin({
            method: 'post',
            uri: 'https://passport.bilibili.com/api/oauth2/getKey',
            form: this.SignParams({
                actionKey: base.actionKey,
                appkey: base.appKey,
                build: base.build,
                mobi_app: base.mobiApp,
                platform: base.platform,
            }), // 一定要用form ！！！ 
            jar: this._jar,
            json: true,
            headers: this._headers,
        }).then((res) => {
            //console.log(res);
            if (res.code === 0) {
                return res.data;
            }else{
                throw new Error("获取公钥时出错,"+res.message);
            }
        });
    }
    _RSAPassWord(publicKey) {
        const padding = {
            key: publicKey.key,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }
        const hashPassWord = publicKey.hash + this.password
        const encryptPassWord = crypto.publicEncrypt(padding, Buffer.from(hashPassWord)).toString('base64');
        return (encryptPassWord)
    }
    async auth(key) {
        let pass = this._RSAPassWord(key)
        let base = this.BASE;
        return api.origin({
            method: 'post',
            uri: 'https://passport.bilibili.com/api/v2/oauth2/login',
            form: this.SignParams({
                appkey: base.appKey,
                build: base.build,
                mobi_app: base.mobiApp,
                platform: base.platform,
                password: pass,
                username: this.id,
            }), // 一定要用form ！！！ 
            jar: this._jar,
            json: true,
            headers: this._headers,
        }).then((res) => {
            if(res.code===0){
                return res.data;
            }else{
                throw new Error("获取cookies时出错,"+res.message);
            }
        });

    }
    set_cookies(token_data,from_cache = false){
        if(!from_cache){
            this.store[this.id] = JSON.stringify(token_data);
        }
        this.token = token_data.token_info;
        this.cookies = token_data.cookie_info;
        this.isLogin = token_data.status==1?false:true;
    }

    async Login(po=false) {//static用于指定是否强制更新，强制更新用于修改了某些值之后需要更新

        this.isLogin = false; // 设置登录标识
        eve.emit("userListUpdated");
        if(this.store[this.id] && !po){
            //如果已有缓存 并且不是强制更新时
            this.set_cookies(JSON.parse(this.store[this.id]),true);
            return;
        }
        /* 登陆流程，需要完成 获取 GVID ，获取公钥 ，RSA加密，获取token和key */

        await this.getGVID(); //获取GVID
        let key = await this.getPublickey(); // 获取公钥
        let auth = await this.auth(key);
        this.set_cookies(auth);
        eve.emit("success",`${this.name} 登录成功`);
        eve.emit("userListUpdated");
    }
    async RefreshCookie() {
        /* 使用Token换取新的cookies */
        let s = await api.origin({
            method: 'POST',
            uri: 'https://passport.bilibili.com/api/v2/oauth2/refresh_token',
            form:this.SignParams({
                access_token:this.token.access_token,
                appkey:this.BASE.appKey,
                build:this.BASE.build,
                mobi_app:this.BASE.mobiApp,
                platform:this.BASE.platform,
                refresh_token:this.token.refresh_token,
            }),
            jar: this._jar,
            json: true,
            headers: this._headers,
        }).then((res)=>{
            if(res.code===0){
                return res.data;
            }else{
                throw new Error("刷新cookies时出错"+res.messgae);
            }
        });
        this.set_cookies(s);
    }
    async RefreshToken() {
        this.Login(true); // Token只能重新认证
    }
}

/* user CLASS

初始化参数：
登录ID
密码
cookies存储库，一个对象，要求可以使用store[this.id]的方式进行设置
名称，用于辨认

*/
export default user;