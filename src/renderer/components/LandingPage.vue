<template>
<el-container style="height:100%">
  <el-aside width="200px">
    <user-config></user-config>
  </el-aside>
  <el-main style="padding:0;max-width:calc(100% - 200px)">
    <danmaku-config></danmaku-config>
    <multiple-stocks></multiple-stocks>
  </el-main>
</el-container>
</template>



<script>
/* 主界面逻辑 */
import user from "~/tools/user.js";
import UserConfig from "@/components/UserConfig";
import DanmakuConfig from "@/components/DanmakuConfig";
import MultipleStocks from "@/components/MultipleStocks";
import {remote} from "electron"

export default {
  name: "LandingPage",
  data() {
    return {};
  },
  mounted() {
    this.addListener();
  },
  methods: {
    addListener(){
      this.$eve.on("restart",message=>{
        this.restart(message);
      })
      this.$eve.on("success",(message)=>{
        this.$message({
          type:"success",
          message,
        });
      })
      this.$eve.on("warning",(message)=>{
        this.$message({
          type:"warning",
          message,
        });
      })
      this.$eve.on("error",(message)=>{
        this.$message.error(message);
      })
    },
    async restart(message){
      this.$eve.emit("success",message);
      await this.sleep(2000);
      for(let i=5;i>0;i--){
        this.$eve.emit("error",`即将重启，还有${i}秒`);
        await this.sleep(1000);
      }
      remote.app.relaunch();
      remote.app.exit(0);
    },
    sleep(ms){
      return new Promise(resolve=>{
        setTimeout(()=>{resolve(ms)},ms);
      });
    }
  },
  components: {
    UserConfig,//用户管理
    DanmakuConfig,//弹幕服务器连接管理
    MultipleStocks,//选项卡
  }
};
</script>

