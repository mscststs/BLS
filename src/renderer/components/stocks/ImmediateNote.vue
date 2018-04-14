<template>
    <div class="ImmediateNote">
        <el-row :gutter="20">
            <el-col :span="24">
                <el-form v-model="Options" inline size="small">
                    <el-form-item label="QQ号">
                        <el-input v-model="Options.u" :disabled="Options.status"></el-input>
                    </el-form-item>
                    <el-form-item label="密码">
                        <el-input v-model="Options.p" type="password" :disabled="Options.status"></el-input>
                    </el-form-item>
                    <el-form-item label="连接">
                        <el-switch v-model="Options.status" @change="Loginswitch"></el-switch>
                    </el-form-item>
                </el-form>
            </el-col>
            <el-col :span="24">
                <el-form v-model="Options" inline size="small">
                    <el-form-item label="监听选项">
                        <el-checkbox v-model="Options.listen.buddy" label="监听私聊" border></el-checkbox>
                        <el-checkbox v-model="Options.listen.discu" label="监听讨论组" border></el-checkbox>
                        <el-checkbox v-model="Options.listen.group" label="监听群" border></el-checkbox>
                    </el-form-item>
                    <el-form-item label="口令,(每个查询必须加上)">
                        <el-input v-model="Options.listen.pass"></el-input>
                    </el-form-item>
                </el-form>
            </el-col>
        </el-row>
    </div>
</template>

<script>

import {QQ} from "qq-bot-rebown";
import { addListener } from 'cluster';
global.log = console.log;

export default {
    name:"ImmediateNote",
    data(){
        return{
            qq:null,
            Options:{
                u:"",
                p:"",
                status:false,
                listen:{
                    buddy:true,
                    discu:true,
                    group:true,
                    pass:"苹朵",
                }
            },
            QueueMsg:[],

        }
    },
    mounted(){
        this.addListener();
    },
    methods:{
        addListener(){
            this.$eve.on("IM",(msg)=>{
                /* IM的消息添加到队列 */
                this.QueueMsg.push(msg);
            });
        },
        Loginswitch(status){
            if(status){
                console.log("尝试登录");
                this.Login();
            }else{
                this.qq._alive = false;
            }
        },
        async Login(){
            const qq = new QQ({
                app:{
                    login:1,
                },
                auth:{
                    u:this.Options.u,
                    p:this.Options.p,
                },
                font:{
                    color:"229b33",
                },
            });
            qq.on("msg",msg=>{
                /* 消息收到 */
                console.log(msg);
            });
            qq.on("disconnect",()=>{
                this.$eve.emit("error","QQ已断开");
            });
            qq.on("error",(err)=>{
                this.$eve.emit("error","QQ模块出错"+err.message);
            });
            qq.on("login-success",()=>{
                /* 登录成功操作 */
                this.$eve.emit("success","QQ登录成功");
            });
            qq.run();
            this.qq = qq;
        },
    },
}
</script>

<style>

</style>
