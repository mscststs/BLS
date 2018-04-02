<template>
<div class="about">
  <el-container>
    <el-header>
       <h1>BLS调度平台</h1>
    </el-header>
    <el-main>
     <p>用于批量调度账号，进行操作</p>
     <p>感谢: 使用了  <a style="color:blue" @click="open('https://github.com/pandaGao/bilibili-live/blob/master/src/service/room/danmaku/')">pandaGao@github</a> 的websocket的相关代码，基于MIT协议</p>
     <p>感谢: 使用了  <a style="color:blue" @click="open('https://github.com/lzghzr/bilive_client')">lzghzr@github</a> 的客户端api部分，基于MIT协议</p>
     <el-form style="margin-top:30px;" inline>
       
       <el-form-item label="">
         <el-button type="success" plain @click="donate">捐赠(Alipay)</el-button>
       </el-form-item>
       <el-form-item label="">
         <el-button type="primary" plain @click="dev">开发者工具</el-button>
       </el-form-item>
     </el-form>
    </el-main>
    <el-footer>
     <p> Powered By MSCSTSTS - All Rights Reserved.</p>
    </el-footer>
  </el-container>
</div>
</template>
<script>
import {shell,ipcRenderer} from "electron";
export default {
  name: "About",
  data() {
    return {};
  },
  mounted() {},
  methods: {
    dev(){
      ipcRenderer.send("DevTools");
    },
    donate(){
      this.open("https://blve.mscststs.com/img/Pay.png");
      this.$eve.emit("success","感谢捐赠");
    },
    open(url){
      shell.openExternal(url);
    }
  }
};
</script>
<style scoped>
.about{
  height: 100%;
}
p{
  margin:5px;
}
</style>
