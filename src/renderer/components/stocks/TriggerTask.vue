<template>
    <div class="trigger-task">
        <el-collapse>
          <el-collapse-item name="小电视" title="小电视">
              <el-row>
                <el-col :span="8">
                    <el-tag type="success">最近轮次: {{SmallTv.SmallTv_id}}</el-tag>
                </el-col>
                <el-col :span="8">
                    <el-tag type="success">最近房间: {{SmallTv.roomid}}</el-tag>
                </el-col>
              </el-row>
          </el-collapse-item>
          <el-collapse-item name="高能" title="高能">
              <el-row>
                <el-col :span="8">
                    <el-tag type="warning">最近轮次: {{Raffle.Raffle_id}}</el-tag>
                </el-col>
                <el-col :span="8">
                    <el-tag type="warning">最近房间: {{Raffle.roomid}}</el-tag>
                </el-col>
              </el-row>
          </el-collapse-item>
        </el-collapse>
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
    };
  },
  mounted() {
    this.AddListener();
  },
  methods: {
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
        let roomid = data.roomid;
        this.getAppRaffleWithRoom(roomid);
    },
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    async joinRaffle(roomid, raffleId, user) {
      try {
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
                this.getSmallTv(roomid, id, user,type);
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
