<template>
    <div class="trigger-task">
        <el-collapse>
          <el-collapse-item name="小电视" title="小电视">
              <el-row>
                <el-col :span="6">
                    <el-tag type="success">最近轮次: {{SmallTv.SmallTv_id}}</el-tag>
                </el-col>
                <el-col :span="6">
                    <el-tag type="success">最近房间: {{SmallTv.roomid}}</el-tag>
                </el-col>
                <el-col :span="12">
                </el-col>
              </el-row>
          </el-collapse-item>
          <el-collapse-item name="高能" title="高能">
              <el-row>
                <el-col :span="6">
                    <el-tag type="warning">最近轮次: {{Raffle.Raffle_id}}</el-tag>
                </el-col>
                <el-col :span="6">
                    <el-tag type="warning">最近房间: {{Raffle.roomid}}</el-tag>
                </el-col>
              </el-row>
          </el-collapse-item>
        </el-collapse>
        <el-row :gutter="20" style="margin-top:20px;">
            <el-col :span="4" style="line-height:38px">
              随机丢弃(%)
            </el-col>
            <el-col :span="20">
              <el-slider
                v-model="dispite"
                show-input
                @change="DispiteUpdate">
              </el-slider>
            </el-col>
            <el-col :span="24" style="margin-top:5px;">
              <el-alert type="info" :closable="false" title="">该项用于控制每次抽奖会被随机抛弃的概率</el-alert>
            </el-col>
        </el-row>
    </div>
</template>

<script>
import { setTimeout } from 'timers';
export default {
  name: "TriggerTask",
  data() {
    return {
      SmallTv: {
        roomid: "无",
        SmallTv_id: "无"
      },
      Raffle: {
        roomid: "无",
        Raffle_id: "无"
      },
      indiv:[],
      dispite:5,
    };
  },
  mounted() {
    this.AddListener();
    this.init();
  },
  methods: {
    DispiteUpdate(val){
      this.$store.update(data=>{
        data.LotteryDispite = val;
      });
    },
    init(){
      if(this.$store.data.LotteryDispite||this.$store.data.LotteryDispite===0){
        //当dispite可能等于0时，就不能用if来判断是不是已经定义，需要加上一条
        this.dispite = this.$store.data.LotteryDispite;
      }
    },
    NeedDispite(){
      return Math.round(Math.random()*100) < this.dispite;
    },
    isExsit(str){
      if(this.indiv.indexOf(str)>=0){
        return true;
      }else{
        this.indiv.push(str);
        setTimeout(()=>{
          this.indiv.shift();
        },1000*60*5);//五分钟后移除
        return false;
      }
    },
    AddListener() {
      this.$eve.on("dm_SmallTv", data => {
        // console.log(data);
        this.Checkfish(data, () => {
          this.smalltv(data);
        });
        
      },-10);
      this.$eve.on("dm_raffle", data => {
        // console.log(data);
        this.Checkfish(data, () => {
          this.appraffle(data);
          this.raffle(data);
        });
      },-10);
      this.$eve.on("dm_liveLottery",data=>{
        this.Checkfish(data,()=>{
          this.lotteryV5(data);
        });
      },-10)
    },
    async Checkfish(data, cb) {
      let roomid = data.roomid;
      let res = await this.$api.send(
        "room/v1/Room/room_init",
        { id: roomid },
        "get"
      );
      if (
        res.code === 0 &&
        !res.data.encrypted &&
        !res.data.is_locked &&
        !res.data.is_hidden
      ) {
        //非钓鱼房间
        let delay = (10+Math.ceil(Math.random()*20))*1000;
        // console.log("延迟 " + delay/1000);
        await this.sleep(delay);//延迟一定时间，据说有用
        // console.log("延迟结束");

        cb();
      } else {
        this.$eve.emit("error", "检测到钓鱼房间！" + roomid);
      }
    },

    async getAppRaffle(event_type,room_id,user){
        try{
            if(this.NeedDispite()){
              this.$eve.emit("info",`${user.name} 丢弃了一个APP 抽奖, 抽奖编号：${raffleId}`);
              return ;
            }
            let join = await this.$api.use(user).send("YunYing/roomEvent",
            user.SignWithBasicQuery({
                event_type,
                room_id,
                access_key:user.token.access_token,
            })
            ,"get");
            if(join.code===0){
                let gift = join.data.gift_desc;
                let giftnum = gift.split("X")[1];
                let giftname = gift.split("X")[0];
                this.$eve.emit("giftCount", user.name, giftname, giftnum,"app抽奖"); //提交统计
            }else{
              this.$eve.emit("info",`${user.name} 参加APP抽奖：${join.msg}`);
            }
        }catch(e){
            this.$eve.emit("info",`${user.name} 参加app 抽奖时: ${e.message}`);
        }
    },
    async getAppRaffleWithRoom(roomid){
        let roominfo=null;
        for(let user of this.$store.users){
            if(user.config.AppRaffle){
                roominfo = await this.$api.use(user).send("AppRoom/index",user.SignWithBasicQuery({
                    room_id:roomid,
                }),"get");
                break;
            }
        }
        if(roominfo){
            for(let ap of roominfo.data.event_corner){
                let type = ap.event_type;
                for(let user of this.$store.users){
                    if(user.config.AppRaffle && user.isLogin){
                        this.getAppRaffle(type,roomid,user); //唤起抽奖
                    }
                }
            }
        }
    },
    appraffle(data){
        // 功能下线 TODO: 转成 cookies 接口
        return;
        let roomid = data.roomid;
        this.getAppRaffleWithRoom(roomid);
    },
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    async joinRaffle(roomid, raffleId, user) {
      try {
        if(this.NeedDispite()){
          this.$eve.emit("info",`${user.name} 丢弃了一个PC 抽奖, 抽奖编号：${raffleId}`);
          return ;
        }
        let api = this.$api.use(user);
        api.headers["Referer"] = `https://live.bilibili.com/${roomid}`;
        let join = await api.send(
          "activity/v1/Raffle/join",
          { roomid, raffleId },
          "get"
        );
        //console.log(join);
        if (join.code === 0) {
          await this.sleep(180 * 1e3); // 等待三分钟
          let notice = await api.send(
            "activity/v1/Raffle/notice",
            { roomid, raffleId },
            "get"
          );
          if (notice.code === 0) {
            let giftnum = notice.data.gift_num;
            let giftname = notice.data.gift_name;
            this.$eve.emit("giftCount", user.name, giftname, giftnum,"pc抽奖"); //提交统计
          }else{
              this.$eve.emit("info",`${user.name} 获取PC结果：${notice.msg}`);
          }
        }
        else{
              this.$eve.emit("info",`${user.name} 参加PC抽奖：${join.msg}`);
            }
      } catch (e) {
        this.$eve.emit("info", `${user.name} 在参加抽奖时: ${e.message}`);
      }
    },
    async raffle(data) {
      await this.sleep(5000);
      //临时等待5s，防止双端无效

      let roomid = data.real_roomid;
      let rq = await this.$api.send(
        "activity/v1/Raffle/check",
        { roomid },
        "get"
      );
      if (rq.code === 0) {
        for (let rf of rq.data) {
            this.Raffle={
                roomid:data.roomid,
                Raffle_id:rf.raffleId,
            }
          if (rf.status === 1) {
            if(this.isExsit(`pc抽奖${rf.raffleId}`)){
              continue;
            }
            let id = rf.raffleId;
            for (let user of this.$store.users) {
              if (user.config.Raffle && user.isLogin) {
                this.joinRaffle(roomid, id, user);
              }
            }
          }
        }
      }
    },
    async getSmallTv(roomid, raffleId, user,type) {
      try {
        let join = await this.$api
          .use(user)
          .send("gift/v3/smalltv/join", { roomid, raffleId }, "get");
        if (join.code === 0) {
          let Time = join.data.time;
          await this.sleep(Time * 1e3);
          let  FaultRetry=5;
          do{
              await this.sleep(60 * 1e3);
              let notice = await this.$api
                .use(user)
                .send("gift/v3/smalltv/notice", { type, raffleId }, "get");
              if (notice.code === 0 && notice.data.gift_num!=0) {
                let giftnum = notice.data.gift_num;
                let giftname = notice.data.gift_name;
                this.$eve.emit("giftCount", user.name, giftname, giftnum,"小电视抽奖"); //提交统计
                break;
              }else if(notice.code != 0){
                this.$eve.emit("info",`${user.name} 获取小电视结果：${notice.msg}`);
                break;
              }else{
                continue;
              }
            }while(FaultRetry--);
        }else{
              this.$eve.emit("info",`${user.name} 参加小电视抽奖：${join.msg}`);
            }
      } catch (e) {
        this.$eve.emit("info", `${user.name} 参与小电视抽奖时: ${e.message}`);
      }
    },
    async getSmallTv_v4(roomid, raffleId, user,type){
      try{
        let award =await this.$api
          .use(user)
          .origin({
            uri:"http://api.live.bilibili.com/gift/v4/smalltv/getAward",
            form:user.SignWithBasicQuery({
                raffleId,
                roomid,
                type,
              }),
            method:"post",
          });
        if(award.code == -401){
          await this.sleep(20e3);
          this.getSmallTv_v4(roomid, raffleId, user,type)
        }else if(award.code == 0){
          this.$eve.emit("giftCount",user.name,award.data.gift_name,award.data.gift_num,"小电视抽奖");
        }else{
          this.$eve.emit("info",`${user.name} 获取小电视结果：${award.msg}`)
        }
      }catch(e){
        this.$eve.emit("info",`${user.name} 参与小电视抽奖时：${e.message}`);
      }
    },
    async lotteryV5(data){
      let roomid = data.real_roomid;
      let rq = await this.$api.send("xlive/lottery-interface/v1/lottery/Check",{roomid},"get");
      if(rq.code === 0){
        let giftList = rq.data.gift;
        for(let gift of giftList){
          
          if(this.isExsit(`新抽奖${gift.raffleId}`)){
            continue;
          }
          this.$eve.emit("info",`发现新抽奖, 房间:${roomid},抽奖编号:${gift.raffleId},还有${gift.time_wait}秒开奖`);
          this.$store.users.filter((user)=>{
            return user.config.SmallTv && user.isLogin
          }).forEach((user)=>{
            if(this.NeedDispite()){
              this.$eve.emit("info",`${user.name} 丢弃了一个抽奖, 抽奖编号：${gift.raffleId}`);
            }else{
              this.joinLotteryV5(user,gift.raffleId,roomid,gift.type,gift.time_wait)
            }
          })
        }
      }
    },
    async joinLotteryV5(user,raffleId,roomid,type,time){
      //console.log("触发抽奖",user,raffleId)
      time = time>0?(time+1) : 0;
      await this.sleep(time*1e3)
      try{

        let rq = await this.$api
          .use(user)
          .send("xlive/lottery-interface/v5/smalltv/join",{
            id:raffleId,
            roomid,
            type,
          },"post")
        if(rq.code == 0){

          this.$eve.emit("giftCount",user.name,rq.data.award_name,rq.data.award_num,"抽奖");
          //this.$eve.emit("info",`${user.name} 获取抽奖结果：${rq.data.award_name} X ${rq.data.award_num}`)
        }else{
          this.$eve.emit("info",`${user.name} 参与抽奖时：${rq.msg}`);
        }
      }catch(e){
        this.$eve.emit("info",`${user.name} 参与抽奖时：${e.message}`)
      }

    },
    async smalltv(data) {
      let roomid = data.real_roomid;
      let rq = await this.$api.send("gift/v3/smalltv/check", { roomid }, "get");
      if (rq.code === 0) {
        for (let sm of rq.data.list) {
          this.SmallTv = {
            roomid: data.roomid,
            SmallTv_id: sm.raffleId,
          };
          if (sm.status === 1) {
            if(this.isExsit(`小电视${sm.raffleId}`)){
              continue;
            }
            let id = sm.raffleId;
            let type = sm.type;
            for (let user of this.$store.users) {
              if (user.config.SmallTv && user.isLogin) {
                // console.log(roomid + " " + id);
                if(this.NeedDispite()){
                  //小电视抽奖丢弃提前，防止后面递归出现重复丢弃
                  this.$eve.emit("info",`${user.name} 丢弃了一个小电视抽奖, 抽奖编号：${id}`);
                  continue;
                }

                if(this.SmallTv_Use_V4){
                  //如果使用v4 API
                  this.getSmallTv_v4(roomid, id, user,type);
                }else{
                  this.getSmallTv(roomid, id, user,type);
                }
              }
            }
          }
        }
      }
    }
  }
};
</script>
<style scoped>

</style>
