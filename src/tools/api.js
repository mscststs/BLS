import rq from "request-promise-native";
import tough from "tough-cookie";
import eve from "~/tools/events.js";
import proxyAgent from "proxy-agent";

const RETRY_LIMIT=5; //重试次数
function  sleep(ms){
    return new Promise(reject=>{
        setTimeout(()=>{reject(ms)},ms);
    })
}
function isJSON(str) {
    if (typeof str == 'string') {
        try {
            var obj=JSON.parse(str);
            if(typeof obj == 'object' && obj ){
                return true;
            }else{
                return false;
            }

        } catch(e) {
            //console.log('error：'+str+'!!!'+e);
            return false;
        }
    }
    return false;
    //console.log('It is not a string!')
}
/* 直接使用api对象,这是一个全局对象 */
export default new class{
    constructor(){
        this.baseURL = `https://api.live.bilibili.com/`;
        this.ts = 0;
        this.thread = 0;
        this.Agent = {
            status :false,
            Agent:{},
        }
    }
    regist(url,name){ //注册快捷调用
        if(!this.FuckList){
            this.FuckList = [];
        }
        this.FuckList.push({url,name});
    }
    fuck(key,...data){ // 快捷调用
        let Fuckurl  = "";
        for(let {url,name} of this.FuckList){
            if(name.indexOf(key)>=0){
                Fuckurl = url;
            }
        }
        return this.send(Fuckurl,...data);
    }

    use(user){
        if(user.isLogin){
            let sma = {
                eve:eve,
                user:user,
                headers:{
                    'host': 'api.live.bilibili.com',
                },
                ori_rq:this.origin,
                cookies:user.cookies,
                FuckList:this.FuckList,
                baseURL:this.baseURL,
                Agent:this.Agent,
                fuck:function(key,...data){
                    let Fuckurl  = "";
                    for(let {url,name} of this.FuckList){
                        if(name.indexOf(key)>=0){
                            Fuckurl = url;
                        }
                    }
                    return this.send(Fuckurl,...data);
                },
                send:function(url,data,method="get",baseURL=this.baseURL,retry=0){
                    let options = {
                        method,
                        uri: baseURL+url,
                        qs: data,
                        form:data,
                        headers: this.headers,
                        timeout:2000,
                        json: true // Automatically parses the JSON string in the response
                    };
                    return this.origin(options).then((res)=>{
                        if(res.code === 0){
                            return res;
                        }else{
                            /* Un normal */
                            if(res.code===-101){
                                this.eve.emit("user_validate",this.user);
                            }
                            return res;
                        }
                    }).catch((e)=>{
                        
                        if(retry < RETRY_LIMIT){
                            return this.send(url,data,method,baseURL,retry+1);
                        }
                        throw new Error("网络异常");
                    });
                },
                origin:function(options){
                    let jar = new rq.jar();
                    let domain = options.uri.match(/https?:\/\/([^\/]+)/i)[0];
                    domain = domain.substr(domain.indexOf(":")+3,1000);
                    if( !(this.cookies&&this.cookies.cookies)){
                        //console.log(options);
                        throw new Error(`${this.user.name} cookies不存在`);
                    }
                    for(let ck of this.cookies.cookies){
                        let cookie = new tough.Cookie({
                            key: ck.name,
                            value: ck.value,
                            domain: domain,
                            httpOnly: ck.http_only==true,
                            expires : new Date(ck.expires*1000),
                        });
                        jar.setCookie(cookie,options.uri);
                    }
                    options.jar = jar;

                    if(this.Agent.status){
                        //检查是否使用代理,仅对用户的连接使用代理
                        options.agent = this.Agent.agent;
                        options.timeout = 10000; //增加代理的延迟
                    }

                    return this.ori_rq(options);;
                }
            }
            return sma;
        }else{
            throw new Error("未登陆");
        }
    }

    async TestAndSetProxy(proxyString){
        //测试代理
        let p = new proxyAgent(proxyString);
        try{
            let res = await this.origin({
                uri:"https://api.live.bilibili.com/ip_service/v1/ip_service/get_ip_addr",
                method:"get",
                agent:p,
            });
            if(res.code == 0){
                this.Agent = {
                    agent : p,
                    status:true,
                } 
                return {
                    useful:true,
                    rq:res
                }
            }else{
                throw new Error("查询IP时返回值不为0");
            }
        }
        catch(e){
            eve.emit("error",e.message);
            return {
                useful:false,
            }
        }
        
       
    }
    /* 使用原始request */
    // async 的函数实际上是promise和genarate的语法糖，在于其可以继续被.then链处理,可以经过普通函数传递
    // 在写这一部分的时候对promise更深有感触，只要在端到端使用await/then,不管中间是经由普通函数还是async函数
    // 都可以被正确的处理。
  
    async origin(options){ 
        /* 全局请求定向到这个函数，方便以后重构到多CDN高并发 */
        let s = (new Date()).valueOf(); //获取当前毫秒时间戳
        if(this.thread >= 7){
            /* 并发限制，不得超过7 */
            await sleep(200);
            return this.origin(options);
        }
        if(s - this.ts < 70){
            /* 频率限制，不得超过50 */
            await sleep(50);
        }
        this.ts = s;
        this.thread++;
        let res;
        try{

            /*正式执行request*/

            res = await rq(options);//必须返回request-promise模块的promise
            //必须放置在try块中，否则会抛出错误导致thread死锁
            if(isJSON(res)){
                res = JSON.parse(res);
            }
        }catch(e){
            console.log(e);
            throw e;
        }finally{
            this.thread--;
        }
        
        
        return res;
    }

    /* 发送请求 */
    send(url,data,method="get",baseURL=this.baseURL,retry=0){
        let options = {
            method,
            uri: baseURL+url,
            qs: data,
            form:data,
            headers: {
                'host': 'api.live.bilibili.com'
            },
            timeout:2000,
            json: true // Automatically parses the JSON string in the response
        };
        return this.origin(options).then((res)=>{
            if(res.code === 0){
                return res;
            }else{
                /* Un normal */
                return res;
            }
        }).catch(()=>{
            if(retry < RETRY_LIMIT){
                return this.send(url,data,method,baseURL,retry+1);
            }
            throw new Error("网络异常");
        });
    }
}();

