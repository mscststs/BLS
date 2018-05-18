<template>
<div class="about">
  <el-container>
    <el-header>
       <h1>BLS调度平台&nbsp;&nbsp;v{{version}}</h1>
    </el-header>
    <el-main>
     <p>用于批量调度账号，进行操作</p>
     <p>本项目托管于  <a style="color:blue" @click="open('https://github.com/mscststs/BLS')">mscststs@github/BLS</a> ，如有问题反馈请提交issue.</p>
     <p>感谢: 使用了  <a style="color:blue" @click="open('https://github.com/pandaGao/bilibili-live/blob/master/src/service/room/danmaku/')">pandaGao@github</a> 的websocket的相关代码，基于MIT协议</p>
     <p>感谢: 使用了  <a style="color:blue" @click="open('https://github.com/lzghzr/bilive_client')">lzghzr@github</a> 的客户端api部分，基于MIT协议</p>
     <el-form style="margin-top:30px;" inline>
       
       <el-form-item label="">
         <el-button type="success" plain @click="donate">捐赠(Alipay)</el-button>
       </el-form-item>
       <el-form-item label="">
         <el-button type="primary" plain @click="dev">开发者工具</el-button>
       </el-form-item>
       <el-form-item label="">
         <el-button type="infor" plain @click="checkUpdate" :loading="load" :disabled="load">检查更新</el-button>
       </el-form-item>
     </el-form>
    </el-main>
    <el-footer>
     <p> Powered By MSCSTSTS - All Rights Reserved.</p>
    </el-footer>


    <el-dialog
      :title="nv.title"
      :visible.sync="nv.dialogVisible"
      width="30%">
      <span>{{nv.name}}</span>
      <br>
      <span v-for="d in nv.body" :key="d">{{d}}<br></span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="nv.dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="ShowNewVersion">查 看</el-button>
      </span>
    </el-dialog>


  </el-container>
</div>
</template>
<script>
import {shell,ipcRenderer} from "electron";
import config from "../../../../package.json";
import rq from "request-promise-native"
import { setTimeout } from 'timers';

export default {
  name: "About",
  data() {
    return {
      version:config.version,
      load:false,
      nv:{
        dialogVisible:false,
        title:"",
        name:"",
        nvurl:"",
        body:[],
      }
    };
  },
  mounted() {
    
  },
  methods: {
    ShowNewVersion(){
      this.nv.dialogVisible = false;
      shell.openExternal(this.nv.nvurl);
    },
    async checkUpdate(){
      if(this.version.indexOf("beta")>=0){
        //当前为测试版
        this.$eve.emit("error","当前为测试版！不支持检查更新");
        return;
      }
      this.load=true;
      try{
        let qs = await rq({
          method:"get",
          uri:"https://api.github.com/repos/mscststs/BLS/releases/latest",
          headers:{
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36",
          },
          json: true,
          timeout:5000,
        });
        if(qs.tag_name){
          if(qs.tag_name==this.version){
            //已是最新版
            this.$eve.emit("success","检查更新：已是最新版");
          }else{
            let body = qs.body.split(/\r\n/);
            this.nv={
              dialogVisible:true,
              title:`发现新版本${qs.tag_name}`,
              name:qs.name,
              nvurl:qs.html_url,
              body,
            }
          }
        }
      }catch(e){
        this.$eve.emit("error","网络异常");
      }
      
      this.load=false;
    },
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
