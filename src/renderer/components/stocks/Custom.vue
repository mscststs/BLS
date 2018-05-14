<template>
<div>
  <div class="user">
    <el-form :model="custom">
      <el-form-item label="选择用户">
        <el-select v-model="custom.selected" collapse-tags multiple placeholder="请选择">
          <el-option
            v-for="user in users"
            :key="user.name"
            :label="user.name"
            :value="user.name"
            :disabled="!user.isLogin">
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
  </div>
  <el-collapse accordion>
    <el-collapse-item name="弹幕发送" title="弹幕发送" >
      <el-form :model="danmaku" inline size="small">
        <el-form-item label="直播间号"><el-input v-model="danmaku.roomid" placeholder="直播间号"></el-input></el-form-item>
        <el-form-item label="弹幕内容"><el-input v-model="danmaku.content" placeholder="弹幕内容"></el-input></el-form-item>
        <el-form-item label=""><el-button type="primary" plain @click="DanmakuSend">发送</el-button></el-form-item>
      </el-form>
    </el-collapse-item>
    <el-collapse-item name="获取直播流" title="获取直播流">
      <el-form :model="LiveStream" size="small" inline @submit.native.prevent>
        <el-form-item label="房间号"><el-input v-model="LiveStream.roomid" placeholder="房间号" clearable ></el-input></el-form-item>
        <el-form-item label="">
          <el-button type="primary" plain :disabled="!LiveStream.roomid.length" @click="getLiveStream">获取</el-button>
          </el-form-item>
          <el-form-item label="" v-if="LiveStream.stream.length">
              <el-select placeholder="请选择" v-model="LiveStream.quality" @change="SwitchQuality" style="width:80px;">
                <el-option
                  v-for="(item,index) in LiveStream.allowedQuality"
                  :key="index+1"
                  :label="LiveStream.qualities[item]"
                  :value="LiveStream.qualities[item]">
                </el-option>
              </el-select>
          </el-form-item>
          <el-form-item label="" v-if="LiveStream.stream.length">
              <el-select placeholder="请选择" v-model="LiveStream.selected" @change="copyStream" style="width:100px;margin-left:30px;">
                <el-option
                  v-for="(item,index) in LiveStream.stream"
                  :key="index+1"
                  :label="'线路'+(index+1)"
                  :value="index+1">
                </el-option>
              </el-select>
          </el-form-item >
          <el-tag  v-if="LiveStream.stream.length" type="success">{{LiveStream.qualities[LiveStream.nowQuality]}}</el-tag>
      </el-form>
    </el-collapse-item>
    <el-collapse-item name="获取cookies" title="获取cookies">
      <el-button type="primary" plain size="small" @click="getUserCookies">复制到剪贴板</el-button>
    </el-collapse-item>
    <el-collapse-item name="总督" title="总督亲密度领取(所有用户)">
      <el-form inline size="small" :model="guardGift">
        <el-form-item label="房间号">
          <el-input placeholder="房间号1;房间号2..." v-model="guardGift.roomid"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" plain size="small" @click="getGuardGift" :disabled="!guardGift.roomid.length">领取亲密度</el-button>
        </el-form-item>
      </el-form>
      
      
    </el-collapse-item>
  </el-collapse>
</div>
</template>
<script>
import {clipboard} from "electron"

export default {
  name: "Custom",
  data() {
    return {
      custom: {
        selected: []
      },
      danmaku: {
        roomid: "",
        content: ""
      },
      LiveStream:{
        qualities:{
          "1":"标清",
          "2":"高清",
          "3":"超清",
          "4":"原画",
        },
        longroomid:"",
        selected:"",
        checked:"",
        roomid: "",
        stream:[],
        quality:"",
        nowQuality:"",
        allowedQuality:[],
      },
      users: [],
      guardGift:{
        roomid:"",
      }
    };
  },
  computed: {
    allowGetWishes() {
      return this.wishes.roomid === "";
    }
  },
  mounted() {
    this.addListener();
    this.$eve.emit("userListUpdated");
  },
  methods: {
    addListener() {
      this.$eve.on("userListUpdated", () => {
        this.users = [];
        this.users = this.$store.users;
      });
    },
    getGuardGift(){
      let roomid =this.guardGift.roomid;
      let roomid_array = roomid.match(/[0-9]{1,}/ig);//获取房间号数组
      for(let shortid of roomid_array){
        this.checkguardGift(shortid);
      }
      this.$eve.emit("success","领取成功");
    },
    async checkguardGift(shortid){
      //通过短号为所有
      let rq = await this.$api.send(
            "room/v1/Room/room_init",
            { id: shortid },
            "get"
          );
          if(rq.code===0){
            let long_id = rq.data.room_id;
            //check
            let ck = await this.$api.send(
              "lottery/v1/lottery/check",
              {roomid:long_id},
              "get"
            );
            if(ck.code===0){
              let GudList = ck.data.guard;
              if(GudList.length){
                //有总督
                for(let gud of GudList){
                  let id = gud.id;
                  let type = gud.keyword;
                  for(let user of this.$store.users){
                    let s =await  this.$api.use(user).send(
                      "lottery/v1/lottery/join",
                      {roomid:long_id,type,id},
                      "post"
                    );
                    if(s.code===0){
                      this.$eve.emit("info",`${user.name} 从 ${shortid} 得到 ${s.data.message}`);
                    }else{
                      this.$eve.emit("info",`${user.name} 从 ${shortid} 领取亲密度 ${s.msg}`);
                    }
                  }
                }

              }else{
                //没有总督呀
              }
            }else{
              this.$eve.emit("info",`检查房间${long_id}的总督时出错`);
            }

          }else{
            this.$eve.emit("error",`房间号 ${shortid} 不合法`);
          }
    },
    getUserCookies(){
      if(this.custom.selected.length!==1){
        this.$eve.emit("error","必须选择一个用户");
      }else{
        let str = "";
        for(let user of this.users){
          if(user.name === this.custom.selected[0]){
            for(let ck of  user.cookies.cookies){
              str+=`${ck.name}=${ck.value};`;
            }
            clipboard.writeText(str);
            this.$eve.emit("success",`${user.name} 的 cookies 已复制到剪贴板`);
            return;
          }
        }
      }
    },
    async DanmakuSend() {
      if (
        this.custom.selected.length !== 0 &&
        this.danmaku.roomid.length !== 0 &&
        this.danmaku.content.length !== 0
      ) {
        let content = this.danmaku.content;
        this.danmaku.content = "";
        let roomid = 0;

        let rq = await this.$api.send(
          "room/v1/Room/room_init",
          { id: this.danmaku.roomid },
          "get"
        );
        if (rq.code === 0) {
          roomid = rq.data.room_id;

          for (let user of this.users) {
            if (this.custom.selected.indexOf(user.name) >= 0) {
              await this.$api.use(user).send(
                "msg/send",
                {
                  color: 16777215,
                  fontsize: 25,
                  mode: 1,
                  msg: content,
                  rnd: Date.parse(new Date()) / 1000,
                  roomid: roomid
                },
                "post"
              );
            }
          }
        } else {
          this.$eve.emit("error", "房间号有误");
        }
      } else {
        this.$eve.emit("error", "有空的选项");
      }
    },

    async getLiveStream(){
      let rq = await this.$api.send(
          "room/v1/Room/room_init",
          { id: this.LiveStream.roomid },
          "get"
        );
        if(rq.code===0){
          if(rq.data.live_status===1){
            this.LiveStream.longroomid = rq.data.room_id;
            let roomid = rq.data.room_id;
            let rq_stream = await this.$api.send("room/v1/Room/playUrl",{
              cid:roomid,
              quality:0,
              platform:"web",
            },"get");
            if(rq_stream.code===0){
              if(rq_stream.data.durl.length){
                this.LiveStream.stream = rq_stream.data.durl;
                this.LiveStream.quality = this.LiveStream.qualities[rq_stream.data.current_quality];
                this.LiveStream.nowQuality = rq_stream.data.current_quality;
                this.LiveStream.allowedQuality = rq_stream.data.accept_quality;
              }
            }else{
              this.$eve.emit("error",`获取直播流时出错: ${rq_stream.msg}`);
            }
          }else{
            this.$eve.emit("error","未直播");
            this.LiveStream.stream=[];
          }
        }
    },
    async SwitchQuality(quality){
      let s = ["标清","高清","超清","原画"];
      quality = s.indexOf(quality)+1;
      if(quality>0&&quality<=4){
        if((this.LiveStream.longroomid+"").length){
          let roomid = this.LiveStream.longroomid;
          let rq_stream = await this.$api.send("room/v1/Room/playUrl",{
              cid:roomid,
              quality:quality,
              platform:"web",
            },"get");
            if(rq_stream.code===0){
              if(rq_stream.data.durl.length){
                this.LiveStream.stream = rq_stream.data.durl;
                this.LiveStream.quality = this.LiveStream.qualities[rq_stream.data.current_quality];
                this.LiveStream.nowQuality = rq_stream.data.current_quality;
                this.LiveStream.allowedQuality = rq_stream.data.accept_quality;
              }
            }else{
              this.$eve.emit("error",`获取直播流时出错: ${rq_stream.msg}`);
            }
        }else{
          this.$eve.emit("error","切换清晰度时丢失长ID(意外错误)");
        }
      }else{
        this.$eve.emit("error","选择清晰度时出现意外选项");
      }
    },
    copyStream(index){
      let text =this.LiveStream.stream[index-1].url;
      clipboard.writeText(text);
       this.$eve.emit("success",`${this.LiveStream.qualities[this.LiveStream.nowQuality]} 线路${index} 已复制到剪贴板`);
    }
  }
};
</script>
<style scoped>

</style>
