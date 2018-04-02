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
      this.$eve.on("success",(message)=>{
        this.$message({
          type:"success",
          message,
        });
      })
      this.$eve.on("error",(message)=>{
        this.$message.error(message);
      })
    }
  },
  components: {
    UserConfig,//用户管理
    DanmakuConfig,//弹幕服务器连接管理
    MultipleStocks,//选项卡
  }
};
</script>

