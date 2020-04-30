<template>
  <div class="IntervalTask">
      <el-collapse>
        <el-collapse-item name="每日签到" title="每日签到">
            <el-row :gutter="20">
              <el-col :span="16">
                  <el-tag type="warning">上次运行时间: {{DailySign.LastRun}}</el-tag>
              </el-col>
              <el-col :span="8">
                  <el-button type="success" size="small" @click="BtnClick_Sign">手动执行</el-button>
              </el-col>
            </el-row>
        </el-collapse-item>
        <el-collapse-item name="每日宝箱" title="每日宝箱">
            <el-row :gutter="20">
              <el-col :span="16">
                  <el-tag type="warning">上次运行时间: {{SilverBox.LastRun}}</el-tag>
              </el-col>
              <el-col :span="8">
                  <el-button type="success" size="small" @click="Silver">手动执行</el-button>
              </el-col>
            </el-row>
        </el-collapse-item>
        
        <el-collapse-item name="银瓜子换硬币" title="银瓜子换硬币">
            <el-row :gutter="20">
              <el-col :span="16">
                  <el-tag type="warning">上次运行时间: {{Silver2Coin.LastRun}}</el-tag>
              </el-col>
              <el-col :span="8">
                  <el-button type="success" size="small" @click="runSilver2Coin">手动执行</el-button>
              </el-col>
            </el-row>
        </el-collapse-item>

        <el-collapse-item name="自动送礼物" title="自动送礼物">
            <el-row :gutter="20">
              <el-col :span="16">
                  <el-tag type="warning">上次运行时间: {{AutoGift.LastRun}}</el-tag>
              </el-col>
              <el-col :span="8">
                  <el-button type="success" size="small" @click="runAutoGift(true)">手动执行</el-button>
              </el-col>
            </el-row>
        </el-collapse-item>


        <el-collapse-item name="批量更新cookies" title="批量更新cookies">
            <el-row :gutter="20">
              <el-col :span="16">
                  <el-tag type="warning">上次运行时间: {{AutoRefreshToken.LastRun}}</el-tag>
              </el-col>
              <el-col :span="8">
                  <el-button type="success" size="small" @click="RefreshToken">手动执行</el-button>
              </el-col>
            </el-row>
        </el-collapse-item>

        <el-collapse-item name="轮询船员房间" title="轮询船员房间">
            <el-row :gutter="20">
              <el-col :span="24" >
                <p style="color:#ea2000">此船员服务器由 dawnnnnnn@github 提供，根据约定，BLS 会向该服务器提供使用者 ID</p>
                <p>如不需要使用此功能，请至<a @click="()=>{$eve.emit('selectTab','配置中心')}" style="color:#6494ff;text-decoration:underline;">配置中心</a>中关闭 “船员亲密” 这一项</p>
              </el-col>
              <el-col :span="16">
                  <el-tag type="warning">上次运行时间: {{GuardQuery.LastRun}}</el-tag>
              </el-col>
              <el-col :span="8">
                  <el-button type="success" size="small" @click="getGuardRoom">手动执行</el-button>
              </el-col>
            </el-row>
        </el-collapse-item>

        <el-collapse-item name="保持在线" title="保持在线">
            <el-row :gutter="20">
              <el-col :span="16">
                  <el-tag type="warning">上次运行时间: {{HeartBeat.LastRun}}</el-tag>
              </el-col>
            </el-row>
        </el-collapse-item>
      </el-collapse>
  </div>
</template>

<script>
import { CronJob } from "cron";
import { setTimeout, clearTimeout } from "timers";
export default {
  name: "IntervalTask",
  data() {
    return {
      DailySign: {
        LastRun: "无"
      },
      SilverBox: {
        LastRun: "无"
      },
      Silver2Coin: {
        LastRun: "无"
      },
      AutoGift:{
        LastRun: "无"
      },
      HeartBeat: {
        LastRun: "无"
      },
      AutoRefreshToken: {
        LastRun: "无"
      },
      GuardQuery: {
        use:false,
        GuardCache:{},
        LastRun: "无"
      }
    };
  },
  mounted() {
    this.addListener(); //添加监听器
    this.GloBalTimeStampes(); //全局计时事件
  },
  methods: {
    addListener() {
      this.$eve.on("dailyTick", () => {
        this.Sign();
        this.DailyTask(); //顺便做一下每日任务
        this.TuanSign(); //应援团签到
        this.Silver(); //宝箱
        this.runSilver2Coin(); //银瓜子换硬币
        this.runAutoGift(false);//自动送礼物
      });
      this.$eve.on("HeartBeat", () => {
        this.KeepAlive();
        this.getGuardRoom(); // 定时检查船员房间
      },-10);
      this.$eve.on("TowDayTick", () => {
        this.RefreshToken(); //更新token
      });
    },
    async getGuardRoom(){
        //首先检查是否有用户开启了该功能
        let Opener = this.$store.users.filter((u)=>{
            return u.config.Guard;
        });
        if(Opener.length){
            //开启该功能的用户数大于 0 
            console.log(Opener);
            try{
                this.GuardQuery.LastRun = this.formatTime(); //更新最后执行时间
                let uid = Opener[Math.floor(Math.random()*Opener.length)].uid; //获取随机用户ID
                uid = Number.isInteger(uid)?uid:100000; //处理纠错
                let room = await this.$api.origin({
                    uri:"http://118.25.108.153:8080/guard",
                    method:"get",
                    timeout:10000,
                    headers:{
                        "User-Agent":`bilibili-live-tools/${uid}`
                    }
                });
                console.log(room)
                if(Array.isArray(room)){
                    for(let item of room){
                        let {Id,RoomId} = item;
                        if(!this.GuardQuery.GuardCache[Id]){
                            //未被缓存
                            this.GuardQuery.GuardCache[Id] = 1;//加进缓存

                            await Promise.all(Opener.map(user=>{
                                return (async function (){
                                    try{
                                        let rq = await this.$api.use(user).send(
                                            "xlive/lottery-interface/v3/guard/join",
                                            {
                                              roomid:RoomId,
                                              type:"guard",
                                              id:Id
                                            },
                                            "post"
                                        );
                                        if(rq.code == 0){
                                            // console.log(rq);
                                            //正确返回
                                            // this.$eve.emit("info",`${user.name} 从 ${OriginRoomId} 得到 ${rq.data.message}`);
                                            if(rq.data.award_text.indexOf("辣条")>=0){
                                                //辣条？
                                                let giftNumber = parseInt(rq.data.award_text.split("X")[1]) | 0; //过滤NaN
                                                this.$eve.emit("giftCount", user.name, "辣条", giftNumber,"船员"); //提交统计
                                            }else if(rq.data.award_text.indexOf("亲密度")>=0){
                                                let giftNumber = parseInt(rq.data.award_text.split("+")[1]) | 0;
                                                this.$eve.emit("giftCount", user.name, "亲密度", giftNumber,"船员"); //提交统计

                                            }
                                        }else{
                                            this.$eve.emit("info",`${user.name} 从 ${RoomId} 领取亲密度 ${rq.msg}`);
                                        }
                                    }catch(e){
                                        console.log(e);
                                        throw new Error("请求亲密度时出错");
                                    }
                                    
                                }).bind(this)()
                            }));

                        }
                    }
                }else{
                    throw new Error("服务器返回的数据不符合预期");
                }
            }catch(e){
                console.log(e);
                this.$eve.emit("error","获取船员房间时出错"+e.message);
            }
        }
        else{
            //当前没有用户开启该功能
        }

    },
    async getCoin(user) {
      let rq = await this.$api
        .use(user)
        .send("pay/v1/Exchange/silver2coin", { platform: "pc" }, "get");
      this.$eve.emit("info", `${user.name} 银瓜子换硬币：${rq.msg}`);
    },
    async runSilver2Coin() {
        this.Silver2Coin.LastRun = this.formatTime(); //更新最后执行时间

        for (let user of this.$store.users) {
            if (user.config.Silver2Coin && user.isLogin) {
                this.getCoin(user);
            }
        }
    },
    async getRoomWeardMedal(user){
      if(user.uid){
        //从uid判断获取
        let rmid = false;
        try{
          let rm = await this.$api.use(user).send("live_user/v1/UserInfo/get_weared_medal",{
            source: 1,
            uid: user.uid,
            target_id: user.uid,
          },"post");
          if(rm.code == 0){
            if(rm.data && rm.data.roominfo){
              rmid = rm.data.roominfo;
            }
          }
        }catch(e){
          this.$eve.emit("info",`尝试获取 ${user.name} 的勋章时：${e.message} `);
        }finally{
          return rmid;
        }
        
      }else{
        this.$eve.emit("info",`触发了一个意料之外的错误，用户 ${user.name} 的uid未能初始化，重启程序或者更新cookies可以解决这个问题`);
        this.$eve.emit("info","这个问题将可能影响到 ： 自动送礼物");
        return 0;
      }
    },
    async getSendableGiftBag(user,roomid=23058){
      let bag = [];
      try{
        let rq = await this.$api.use(user).send(`xlive/web-room/v1/gift/bag_list?t=${new Date().valueOf()}&room_id=${roomid}`);
        if(rq.code==0){
          for(let mybag of rq.data.list){
            if(mybag.expire_at==0){
              continue;
            }
            let nowTimeStamp = Math.round((new Date().valueOf())/1000);
            if(mybag.expire_at > nowTimeStamp && mybag.expire_at - nowTimeStamp < 60*60*24){
              //如果在24小时内过期，则尝试送出该包裹
              bag.push(mybag);
            }
          }
        }
      }
      catch(e){
        this.$eve.emit("info",`尝试获取${user.name}的礼物包裹时：${e.message}`);
      }
      finally{
        return bag;
      }

    },
    async getTargetRoom(user){
      if(user.config.AutoGiftTargetRoom){
        // 设置了目标房间号
        // 尝试直接获取目标房间
        try {
          let rq = await this.$api.use(user).send(`xlive/web-room/v1/index/getInfoByRoom?room_id=${user.config.AutoGiftTargetRoom}`);
          if(rq.code == 0){
            let roominfo = {...rq.data.room_info, ...rq.data.anchor_info.base_info}
            return roominfo
          }else{
            this.$eve.emit("info",`尝试获取 ${user.name} 的送礼房间失败，房间号 :${user.config.AutoGiftTargetRoom}：${e.message} `);
          }
        } catch (error) {
          this.$eve.emit("info",`初始化 ${user.name} 的送礼房间失败，房间号 :${user.config.AutoGiftTargetRoom}`);
        }
      }else{
        return await this.getRoomWeardMedal(user);
      }
    },
    async TrySendGift(user){
      let roominfo = await this.getTargetRoom(user)
      if(roominfo){
        //拿到了 roominfo
        let bag = await this.getSendableGiftBag(user);
        if(bag.length){
          for(let b of bag){
            try{
              let s = await this.$api.use(user).send("gift/v2/live/bag_send",{
                uid: user.uid,
                gift_id: b.gift_id,
                ruid: roominfo.uid,
                gift_num: b.gift_num, // 临时写死
                bag_id: b.bag_id,
                platform: "pc",
                biz_code: "live",
                biz_id: roominfo.room_id,
                rnd: Math.round((new Date().valueOf())/1000),
                storm_beat_id: 0,
                metadata: "",
                price: 0,
              },"post");
              if(s.code==0){
                this.$eve.emit("info",`${user.name} 向 ${roominfo.uname} 赠送了 ${s.data.gift_num} 个 ${s.data.gift_name}`);
              }
            }catch(e){
              this.$eve.emit("info",`${user.name} 赠送礼物时：${e.message}`);
            }
            
          }
        }
      }else{
        // 未佩戴勋章 或出错 ，不操作

      }
    },
    async runAutoGift(now=true){
      if(!now){
        await this.sleep(60e3); // 先等一分钟，拿到所有每日任务和签到的辣条礼物
      }
      this.AutoGift.LastRun = this.formatTime(); //更新最后执行时间
      for(let user of this.$store.users){
        if(user.config.AutoGift && user.isLogin){
          this.TrySendGift(user);
        }
      }
    },
    async RefreshToken() {
        this.AutoRefreshToken.LastRun = this.formatTime();
        for (let user of this.$store.users) {
            await user.RefreshToken();
        }
    },
    BtnClick_Sign() {
        //手动触发每日签到
        this.Sign();
        this.DailyTask(); //顺便做一下每日任务
        this.TuanSign(); //应援团签到
    },
    sleep(ms) {
        return new Promise(reject => {
        setTimeout(() => {
            reject(ms);
        }, ms);
        });
    },
    async HeartBeatSend(user) {
        // 功能下线 TODO: 转成 cookies 接口
        return;
        let it = this.$api.use(user);
        it.headers["Referer"] = `https://live.bilibili.com/${
        this.$store.DanmakuRoom
        }`; //设置referer
        let pc = await it.send("User/userOnlineHeart", {}, "post");
        try {
        it.origin({
            /* APP端心跳 */
            uri: `https://api.live.bilibili.com/mobile/userOnlineHeart`,
            qs: user.SignWithBasicQuery({
            access_key: user.token.access_token
            }),
            form: {
            room_id: this.$store.DanmakuRoom,
            scale: "xxhdpi"
            },
            method: "post"
        });
        } catch (e) {
              console.error(error)
        this.$eve.emit("error", e.message);
        }
    },
    KeepAlive() {
        this.HeartBeat.LastRun = this.formatTime(); //更新最后执行时间

        for (let user of this.$store.users) {
        if (user.config.KeepAlive && user.isLogin) {
            this.HeartBeatSend(user);
        }
        }
    },
    async getSilver(user) {
        // 功能下线 TODO: 转成 cookies 接口
        return;
        try {
        let rq = await this.$api.use(user).send(
            "mobile/freeSilverCurrentTask",
            user.SignWithBasicQuery({
            access_key: user.token.access_token
            })
        );
        if (rq.code == 0) {
            let time = rq.data.minute * 6e4;
            await this.sleep(time);
            let sl = await this.$api.use(user).send(
            "mobile/freeSilverAward",
            user.SignWithBasicQuery({
                access_key: user.token.access_token
            })
            );
            this.getSilver(user); // 递归
        } else if (rq.code == -10017) {
            this.$eve.emit("info", `${user.name} 领宝箱: ${rq.msg}`);
            /* 今日宝箱已领完 */
        }
        } catch (e) {
        this.$eve.emit("info", `${user.name} 领取银瓜子宝箱 : ${e.message}`);
        }
    },
    Silver() {
        this.SilverBox.LastRun = this.formatTime(); //更新最后运行时间

        for (let user of this.$store.users) {
        if (user.config.SilverBox && user.isLogin) {
            this.getSilver(user);
        }
        }
    },
    DailyTask() {
        for (let user of this.$store.users) {
        if (user.isLogin) {
            try {
            this.$api
            .use(user)
            .send(
                "activity/v1/task/receive_award",
                { task_id: "double_watch_task" },
                "post"
            );
            } catch (error) {
              console.error(error)
            this.$eve.emit("error",error.message);
            }
            
        }
        }
    },
    async userTuanSign(user) {
        // 功能下线 TODO: 转成 cookies 接口
        return;
        try {
        let list = await this.$api.use(user).origin({
            uri: "https://api.vc.bilibili.com/link_group/v1/member/my_groups",
            qs: user.SignWithBasicQuery({
            access_key: user.token.access_token
            }),
            method: "get"
        });
        if (list.code === 0) {
            for (let group of list.data.list) {
            let sign = await this.$api.use(user).origin({
                uri:
                "https://api.vc.bilibili.com/link_setting/v1/link_setting/sign_in",
                qs: user.SignWithBasicQuery({
                group_id: group.group_id,
                owner_id: group.owner_uid,
                access_key: user.token.access_token
                }),
                method: "get"
            });
            this.$eve.emit(
                "info",
                `${user.name} 应援团 [ ${group.group_name} ] 签到 :${sign.msg}`
            );
            //发送请求即可
            }
        }
        } catch (e) {
        this.$eve.emit("info", `${user.name} 应援团签到时: ${e.message}`);
        }
    },
    TuanSign() {
        for (let user of this.$store.users) {
        if (user.config.DailySign && user.isLogin) {
            this.userTuanSign(user);
        }
        }
    },
    async Sign() {
        this.DailySign.LastRun = this.formatTime(); //更新最后运行时间

        for (let user of this.$store.users) {
        if (user.config.DailySign && user.isLogin) {
            try {
            this.$api
                .use(user)
                .send("gift/v2/live/receive_daily_bag", {}, "get"); //每日包裹，不重要
            let rq = await this.$api.use(user).send("sign/doSign", {}, "get"); //签到
            this.$eve.emit("info", `${user.name} 签到: ${rq.data ? rq.data.text :rq.message}`);
            } catch (e) {
            this.$eve.emit("info", `${user.name} 签到: ${e.message}`);
            }
        }
        }
    },
    GloBalTimeStampes() {
        /* 负责在初始化之后提供全局计时事件 */
        setTimeout(() => {
            this.Sign();
            this.DailyTask(); //顺便做一下每日任务
            this.TuanSign(); //应援团签到
            //this.Silver(); //宝箱
            this.runSilver2Coin(); //银瓜子换硬币
            this.runAutoGift(false); //自动送礼物
        }, 10e3); //载入10秒后做一遍每日签到
        /* 使用cron进行定时任务,每天12点emit一个dailyTick事件 */
        let dailyjob = new CronJob(
        "00 00 12 * * *",
        () => {
            this.$eve.emit("dailyTick"); // 触发dailyTick事件
        },
        null,
        true
        // timeZone:"China/Shanghai",
        );

        //每2天自动重新登录
        let SeveralDayTick = new CronJob(
        "00 00 03 */2 * *",
        () => {
            this.$eve.emit("TowDayTick"); // 触发TowDayTick事件
        },
        null,
        true
        // timeZone:"China/Shanghai",
        );

        this.$eve.emit("HeartBeat"); // 触发心跳请求
        let heartjob = new CronJob(
        "0 */5 * * * *",
        () => {
            this.$eve.emit("HeartBeat"); // 触发心跳请求
        },
        null,
        true
        // timeZone:"China/Shanghai",
        );
    },
    formatTime(date = new Date(), fmt = "YYYY-MM-DD HH:mm:ss") {
        date = typeof date === "number" ? new Date(date) : date;
        var o = {
        "M+": date.getMonth() + 1,
        "D+": date.getDate(),
        "h+": date.getHours() % 12 === 0 ? 12 : date.getHours() % 12,
        "H+": date.getHours(),
        "m+": date.getMinutes(),
        "s+": date.getSeconds(),
        "q+": Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds()
        };
        var week = {
        "0": "\u65e5",
        "1": "\u4e00",
        "2": "\u4e8c",
        "3": "\u4e09",
        "4": "\u56db",
        "5": "\u4e94",
        "6": "\u516d"
        };
        if (/(Y+)/.test(fmt)) {
        fmt = fmt.replace(
            RegExp.$1,
            (date.getFullYear() + "").substr(4 - RegExp.$1.length)
        );
        }
        if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(
            RegExp.$1,
            (RegExp.$1.length > 1
            ? RegExp.$1.length > 2 ? "\u661f\u671f" : "\u5468"
            : "") + week[date.getDay() + ""]
        );
        }
        for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(
            RegExp.$1,
            RegExp.$1.length === 1
                ? o[k]
                : ("00" + o[k]).substr(("" + o[k]).length)
            );
        }
        }
        return fmt;
    }
    }
    };
</script>
<style scoped>
</style>
