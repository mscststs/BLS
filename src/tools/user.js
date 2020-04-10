import rq from "request-promise-native"
import crypto from "crypto"
import api from "./api.js"
import eve from "./events"
import {userLogin} from "./BLSv2_utils/tools"


class user {
    constructor(id, password,store={},name="new User") {
        /* Global */
        this.uid = 0;
        this.config = {};//为configCenter准备的插槽，这样其他的组件可以直接使用user.config.xxx而不会报错了
        this.name = name;
        this.store = store;
        this.id = id;
        this.isLogin = false
        this.password = password;

    }
    async CheckUid(){
        //获取用户UID，顺便确认登录成功
        try{
            this.isLogin = true; // 允许 api 直接调用一次
            let rq= await api.use(this).send("User/getUserInfo");
            if(rq.code == "REPONSE_OK" ||rq.msg =="success" ){
                this.uid = rq.data.uid;
                //暂时只需要uid
                this.isLogin = true;
                return true
            }else{
                this.isLogin = false;
                return false
            }
        }catch(e){
            eve.emit("error",e.message);
            this.isLogin = false;
            return false
        }
    }

    async Login(force=false) {//static用于指定是否强制更新，强制更新用于修改了某些值之后需要更新
        const storeKey = "Cookie--"+this.id // 新id
        if(!force){
            // 非强制刷新，检查用户当前存档的登录态
            let cookies = JSON.parse(this.store[storeKey] || '[]')
            if(cookies.length){
                // 有缓存
                this.cookies = {
                    cookies,
                }
                await this.CheckUid()
                if(this.isLogin){
                    // Cookies 有效 
                    return true
                }
            }
            // cookies 缓存失效
        }
        // 进入强制获取 cookies 流程
        this.cookies = {
            cookies: []
        };
        try{
            this.cookies.cookies = await userLogin(this.id,this.password)
            this.store[storeKey] = JSON.stringify(this.cookies.cookies)
            this.CheckUid()
        }catch(e){
            console.error(e)
        }finally{
            return this.isLogin
        }
        
    }
    async RefreshCookie() {
        this.Login(); // Token只能重新认证
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