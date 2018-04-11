<template>
  <div class="Mock">
      <el-row :gutter="10">
        <el-col :span="24">
            <el-form :model="raw" label-width="100px" label-position="left" size="small">
              <el-form-item label="URL">
                  <el-input v-model="raw.uri" placeholder="">
                      <template slot="prepend">https://</template>
                  </el-input>
              </el-form-item>
              <el-form-item label="请求方式">
                  <el-switch v-model="raw.method" 
                  active-value="post" 
                  inactive-value="get"
                  active-text="POST"
                  inactive-text="GET"
                  active-color="#13ce66"
                  inactive-color="#449cd6"></el-switch>
              </el-form-item>
              <el-form-item label="GET参数">
                  <el-input v-model="raw.data_get" placeholder='{"key1":"value1","key2":"value2"}'></el-input>
              </el-form-item>
              <el-form-item label="POST参数">
                  <el-input :disabled="raw.method=='get'" v-model="raw.data_post" placeholder='{"key1":"value1","key2":"value2"}'></el-input>
              </el-form-item>
              <el-form-item label="认证模式">
                  <el-switch v-model="raw.AppSign"
                  active-text="Token模式"
                  inactive-text="Cookies模式"
                  active-color="#13ce66"
                  inactive-color="#449cd6"></el-switch>
              </el-form-item>
              <el-form-item label="开始">
                  <el-button type="primary" plain :disabled="inprogress" @click="genarate">Genarate</el-button>
              </el-form-item>
            </el-form>
        </el-col>
        <el-col :span="24">
            <el-alert type="info"  v-for="res in aResult" :key="res.user" :title="res.user" style="margin:2px 0;" :closable="false">{{res.result}}</el-alert>
        </el-col>
      </el-row>
  </div>
</template>

<script>
/* 用于自行Mock特殊请求 */
export default {
    name:"Mock",
    data(){
        return{
            raw:{
                uri:"",
                method:"",
                data_get:"",
                data_post:"",
                AppSign:false,
            },
            inprogress:false, //判断当前是否正在发送请求中,
            aResult:[],
        }
    },
    mounted(){

    },
    methods:{
        rawConfirm(){
            if(this.raw.uri.length===0){
                return false;
            }
            try{
                if(this.raw.data_get.length){
                    let s = JSON.parse(this.raw.data_get);
                    if(typeof(s)!="object"){
                        return false;
                    }
                }
                if(this.raw.data_post.length){
                    let s = JSON.parse(this.raw.data_post);
                    if(typeof(s)!="object"){
                        return false;
                    }
                }
            }catch(e){
                return false;
            }
            return true;
        },
        async genarate(){
            if(this.inprogress){
                this.$eve.emit("error","当前已经有一个进程");
                return; 
            }
            if(this.rawConfirm()){
                // this.$eve.emit("success","校验成功");
                this.inprogress = true;
                await this.Mock();
                this.inprogress = false;
            }else{
                this.$eve.emit("error","校验失败");
            }
        },
        async fetch(options,user,isAppSign){
            if(isAppSign){ //处理token
                let qs = options.qs;
                qs["access_key"] =user.token.access_token;
                options.qs = user.SignWithBasicQuery(qs);
            }
            let s = await this.$api.use(user).origin(options);
            try{
                s = JSON.parse(s);
            }catch(e){

            }
            let res = {
                user:user.name,
                result:s,
            };
            return res;
        },
        async Mock(){
            let uri  ="https://"+this.raw.uri;
            let method = this.raw.method;
            let qs = {};
            if(this.raw.data_get.length){
                qs = JSON.parse(this.raw.data_get);
            }
            
            let form= {};
            if(method === "post" && this.raw.data_post.length){
                form = JSON.parse(this.raw.data_post)
            };
            let options = {
                uri,
                method,
                qs,
                form,
            }
            // console.log("emmmmmmmmm")
            let aRequest = [];
            for(let user of this.$store.users){
                if(user.isLogin){
                    aRequest.push(this.fetch(options,user,this.raw.AppSign));
                }
            }
            
            try{
                this.aResult = await Promise.all(aRequest);
            }catch(e){

            }
        }

    },
}
</script>
<style scoped>

</style>
