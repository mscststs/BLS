<template>
  <div class="danmaku-panel">
      <div class="roominfo">
          <el-form size="mini" :inline="true" class="form" @submit.native.prevent>
            <el-form-item label="直播间">
                    <el-input style="width:85px;padding:0 5px;" v-model="room.roomid" placeholder="房间号" :disabled="room.switch" size="mini"></el-input>
            </el-form-item>
            <el-form-item >
                    <el-switch
                        :disabled="!validateRoom"
                        v-model="room.switch"
                        @change="toggleRoom"
                        active-color="#13ce66"
                        inactive-color="#ff4949">
                    </el-switch>
            </el-form-item>
            <el-form-item v-if="room.switch">
              <el-tag size="small">人气：{{room.onlineNumber}}</el-tag>
            </el-form-item>
            <el-form-item v-else>
              <el-tag type="danger" size="small">未连接</el-tag>
            </el-form-item>
          </el-form>
      </div>
      <div class="danmakuInfo">
        <div class="control">
          <el-switch
            v-model="control.active"
            active-color="#13ce66"
            active-text="活动">
          </el-switch>
          <el-switch
          style="margin-top:5px;"
            v-model="control.chat"
            active-color="#13ce66"
            active-text="弹幕">
          </el-switch>
        </div>
        <div class="info">
          <p>{{info[0]}}</p>
          
          <p>{{info[1]}}</p>
          
          <p>{{info[2]}}</p>
        </div>
      </div>
      <danmaku-multiadds></danmaku-multiadds>
  </div>
</template>
<script>
/* 弹幕服务逻辑 */
import DmService from "~/tools/danmaku";
import DanmakuMultiadds from "@/components/DanmakuAddons/DanmakuMultiadds.vue";

export default {
  name: "DanmakuConfig",
  data() {
    return {
      dm: {},
      message: "",
      room: {
        switch: false,
        roomid: 23058,
        onlineNumber: 0
      },
      control: {
        active: true,
        chat: false
      },
      info: []
    };
  },
  computed: {
    validateRoom() {
      return /^\d{1,}/.test(this.room.roomid);
    }
  },
  components: {
    DanmakuMultiadds
  },
  mounted() {
    this.addListener();
    this.CreatDms(this.room.roomid);
  },
  methods: {
    toggleRoom(status) {
      /* 
      这里，关闭连接的时候会报一个undefined错误，大概原因是释放连接的时候，websocket的状态不对，但是无法fix，除非重写那些模块
      不影响程序运行，来日再改
      */
      if (!status) {
        this.dm.disconnect();
        this.dm = {};
      } else {
        this.CreatDms(this.room.roomid);
      }
    },
    addInfo(str) {
      if (this.info.length >= 3) {
        this.info.shift();
      }
      this.info.push(str);
    },
    addListener() {
      this.$eve.on("dm_online", data => {
        this.room.onlineNumber = data.number;
      });
      this.$eve.on("dm_chat", data => {
        if (this.control.chat) {
          this.addInfo(`${data.user.name} : ${data.comment}`);
        }
      });
      this.$eve.on("dm_raffle", data => {
        if (this.control.active) {
          this.addInfo(`${data.msg_text}`);
        }
      });
      this.$eve.on("dm_SmallTv", data => {
        if (this.control.active) {
          this.addInfo(`${data.msg_text}`.replace(/:\?/g, ""));
        }
      });
    },
    async CreatDms(roomid) {
      let rq = await this.$api.send(
        "room/v1/Room/room_init",
        { id: roomid },
        "get"
      );
      if (rq.code !== 0) {
        this.$eve.emit("error", "直播间不存在");
        this.room.switch = false;
        return;
      }
      roomid = rq.data.room_id;

      let short_id = rq.data.short_id || rq.data.room_id;

      this.$store.DanmakuRoom = short_id;

      if (Object.keys(this.dm).length && this.dm._socket) {
        /* 防止多个socket并存 */
        this.dm.disconnect();
        this.dm = {};
      }
      this.dm = new DmService({
        roomId: roomid
      });
      this.dm.on("connected", () => {
        this.room.switch = true;
        this.$eve.emit("success", `直播间 ${roomid} 连接成功`);
      });

      this.dm.connect();
      this.dm.on("error", () => {
        this.room.switch = false;
      });
      this.dm.on("data", data => {
        switch (data.type) {
          case "comment":
            this.$eve.emit("dm_chat", data);
            break;
          case "SYS_MSG":
            /* 绘马没有roomid参数，小电视+摩天大楼等绿色通知 */
            if (data.roomid) {
              if (data.msg.indexOf("小电视")>=0) {
                //仅提取小电视
                this.$eve.emit("dm_SmallTv", data);
              }
              //console.log(data);
            }
            break;
          case "SYS_GIFT":
            if (data.roomid) {
              /* 礼物高能没有roomid参数 */
              this.$eve.emit("dm_raffle", data);
            }
            break;
          case "online":
            this.$eve.emit("dm_online", data);
            //console.log(data);
            break;
          case "gift":
            this.$eve.emit("dm_gift", data);
            break;
          default:
            break;
        }
      });
    }
  }
};
</script>

<style scoped>
.danmaku-panel {
  width: 100%;
  position: relative;
  height: 55px;
  background-color: rgb(229, 241, 250);
  box-shadow: 0px 0 6px 0 #aaa inset;
}
.roominfo {
  height: 55px;
  position: relative;
  float: left;
  width: 340px;
  background-color: transparent;
  box-shadow: -1px 0px 0 0px #ccc inset;
}
.danmakuInfo {
  width: calc(100% - 340px);
  position: relative;
  float: left;
  height: 55px;
  background-color: transparent;
}
.control {
  width: 80px;

  height: 45px;
  padding: 5px 10px;
  float: left;
}
.info {
  width: calc(100% - 100px);
  height: 45px;
  float: left;
  padding: 5px 0;
  overflow: hidden;
}
.info p {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-left: 5px;
  font-family: "PingFang SC", "微软雅黑", sans-serif;
  color: #666;
  font-size: 12px;
  height: 15px;
  line-height: 15px;
  transform: all 0.5s;
}
.form {
  overflow: hidden;
  padding: 0 15px;
  padding-top: 13px;
  height: 40px;
  white-space: nowrap;
}
</style>
