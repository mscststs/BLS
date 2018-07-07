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
      <div style="margin-bottom:7px;border-bottom:1px solid #999;border-top:1px solid #999;padding:7px;">
        <span v-if="nv.allowAutoUpdate" style="color:#05752b"><i class="el-icon-circle-plus"></i>该更新支持增量更新</span>
        <span v-else style="color:#f7696b"><i class="el-icon-circle-close"></i>该更新不支持增量更新</span>
        <el-button size="mini" @click="AutoUpdateUsage">使用说明</el-button>
        <br>
      </div>
      <span>{{nv.name}}</span>
      <br>
      <span v-for="d in nv.body" :key="d">{{d}}<br></span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="nv.dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="ShowNewVersion">查 看</el-button>
        <el-button type="success" @click="Update(nv.remoteTag)" v-show="nv.allowAutoUpdate">增量更新(beta)</el-button>
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
import fs from "~/tools/fs"

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
        allowAutoUpdate:false,
        remoteTag:"0.0.0",
      },
      notify:{},
    };
  },
  mounted() {
  },
  methods: {
    AutoUpdateUsage(){
      if(this.notify.close && this.notify.close() || 1){
        this.notify =this.$notify({
          title: '增量更新使用说明',
          message: '增量更新仅在小版本更新时可用，大版本更新说明程序的依赖组件发生了改变，只能使用安装包进行覆盖升级',
          type: 'warning',
          duration: 0
        });
      }
      
    },
    async Update(tag){
      this.nv.dialogVisible = false;
      this.$eve.emit("warning","开始增量更新");

      if(await this.CheckLocalFile()){
        //文件均存在
        try{
          let fl = this.getFilePath();
          for(let f of fl){
            let content = await this.getRemoteFile(tag,f);
            if(content){
              await fs.WriteString(f.localPath,content);
            }else{
              throw new Error("更新失败，无法获取增量更新文件");
            }
          }
          this.$eve.emit("restart","更新完成，即将重启以升级新版本");
        }catch(e){
          this.$eve.emit("error","增量更新时:"+e.message);
        }
      }else{
        this.$eve.emit("error","自动更新失败：本地路径下未找到对应文件");
      }
    },
    async getRemoteFile(tag,f,retry=0){
      let remoteBaseLink = [
        `https://raw.githubusercontent.com/mscststs/BLS/${tag}/`,
        `https://gitee.com/mscststs/BLS/raw/${tag}/`,
      ];
      try{
        let uri = remoteBaseLink[retry]+f.ProjectRelativePath+f.name;
        let result = await rq({
          uri,
          method:"get",
          headers:{
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36",
          },
          timeout:8000,
        });
        //console.log(result);
        return result;
      }catch(e){
        if(retry<remoteBaseLink.length){
          return this.getRemoteFile(tag,f,retry-(-1));
        }else{
          this.$eve.emit("error","获取增量更新文件时: "+e.message);
          return false;
        }
      }
    },
    getFilePath(){
      let filePath = __filename;
      let ResourceRootIndex = filePath.indexOf("app.asar");
      let LocalDir = filePath.slice(0,ResourceRootIndex)+"app.asar.unpacked\\dist\\electron\\";
      let TagetFiles = [
        {
          name:"main.js",
          ProjectRelativePath:"dist/electron/",
          localPath:LocalDir+"main.js"
        },
        {
          name:"renderer.js",
          ProjectRelativePath:"dist/electron/",
          localPath:LocalDir+"renderer.js",
        },
        {
          name:"styles.css",
          ProjectRelativePath:"dist/electron/",
          localPath:LocalDir+"styles.css",
        },
        {
          name:"index.html",
          ProjectRelativePath:"dist/electron/",
          localPath:LocalDir+"index.html"
        },
        {
          name:"package.json",
          ProjectRelativePath:"",
          localPath:filePath.slice(0,ResourceRootIndex)+"app.asar.unpacked\\"+"package.json"
        }
      ];
      return TagetFiles;
    },
    async CheckLocalFile(){
      let fp = this.getFilePath();
      let pr = [];
      for(let s of fp){
        pr.push(fs.exists(s.localPath));
      }
      let n =await Promise.all(pr);
      for(let result of n){
        if(!result){
          return false;
        }
      }
      return true;
    },
    ShowNewVersion(){
      this.nv.dialogVisible = false;
      shell.openExternal(this.nv.nvurl);
    },
    isVersionOut(local_version,remote_version){
      let local = local_version.split(".");
      let remote = remote_version.split(".");
      let flag = 0;
      for(let i=0;i<local.length;i++){
        if(parseInt(remote[i])>parseInt(local[i])){
          flag = local.length-i;
          break;
        }else if(parseInt(remote[i])<parseInt(local[i])){
          flag = 0;
          break;
        }
      }
      return flag;
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
          timeout:8000,
        });
        if(qs.tag_name){
          if(!this.isVersionOut(this.version,qs.tag_name)){
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
              allowAutoUpdate:this.isVersionOut(this.version,qs.tag_name)==1,
              remoteTag : qs.tag_name,
            }
          }
        }
      }catch(e){
        this.$eve.emit("error","检查更新：网络异常");
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
