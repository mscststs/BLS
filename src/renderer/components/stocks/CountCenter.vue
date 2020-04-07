<template>
    <div>
    <el-row>
        <el-col :span="24">
            <el-form :model="serverConfig" inline size="small">
                <el-form-item label="端口">
                    <el-input v-model="serverConfig.port" placeholder="" :disabled="serverConfig.open"></el-input>
                </el-form-item>
                <el-form-item label="">
                    <el-switch v-model="serverConfig.open"
                    active-text="开启服务器"
                    inactive-text="关闭服务器"
                    @change="ChangeServerStatus"></el-switch>
                </el-form-item>
                <el-form-item label="" style="float:right">
                    <el-button type="primary" plain @click="ServerUsage()">
                        帮助
                    </el-button>
                </el-form-item>
            </el-form>
        </el-col>
        <el-col :span="24" v-if="serverConfig.open">
            <el-alert type="info" title="" :closable="false">
                你可以通过:  http://[你的IP或域名]:{{serverConfig.port}}/    来随时查看统计中心
            </el-alert>
        </el-col>
    </el-row>
    <div ref="CountCenter">
        <el-table :data="userGifts" ref="CountTable" :cell-style="{padding:'3px 0'}">
            <el-table-column prop="user" label="用户">

            </el-table-column>
            <el-table-column v-for="tp in types" :key="tp" :prop="tp" :label="tp">

            </el-table-column>
        </el-table>
    </div>

    </div>
</template>

<script>
import { CronJob } from "cron";
import server from "./CountCenterAddons/httpServer"
export default {
    name:"CountCenter",
    data(){
        return{
            types:[],
            userGifts:[],
            Httpserver:new server(()=>{
                return this.getHTML();
            }),
            serverConfig:{
                port:8877,
                open:false,
            },
            notify:{},
        }
    },
    mounted(){
        this.AddListenner();
        this.setTask();
    },
    methods:{
        ServerUsage(){
            if(this.notify.close && this.notify.close() || 1){
                this.notify =this.$notify({
                title: 'server使用说明',
                message: '如果你的服务器运行于公网，开启该服务，你可以随时通过网页查看你的统计信息',
                type: 'warning',
                duration: 0
                });
            }
        
        },
        async ChangeServerStatus(val){
            if(val){
                let res = this.Httpserver.Open(this.serverConfig.port);
                if(!res){
                    this.serverConfig.open = false;
                }
            }else{
                this.Httpserver.close();
            }
        },
        getHTML(){
            return this.$refs.CountCenter.innerHTML;
        },
        setTask(){
            let dailyjob = new CronJob(
                "00 00 00 * * *",
                () => {
                    this.$eve.emit("ZeroClear");
                    //每天凌晨0点发出清空信号
                },
                null,
                true
                // timeZone:"China/Shanghai",
            );
        },
        AddListenner(){
            this.$eve.on("giftCount",(user,name,number,type)=>{
                this.CheckGiftName(name); //检查礼物类别，添加到列中
                this.CheckUsergift(user,name,parseInt(number));
                
            });
            this.$eve.on("tabChanged",(name)=>{
                //界面重排，防止挤在一起。
                if(name=="统计中心"){
                    setTimeout(()=>{
                        this.$refs.CountTable && this.$refs.CountTable.doLayout();
                    },100);
                }
            });
            this.$eve.on("ZeroClear",()=>{
                this.types = [];
                this.userGifts = [];
            });
        },
        CheckGiftName(Giftname){
            if(this.types.indexOf(Giftname)>=0){

            }else{
                this.types.push(Giftname);
            }
        },
        CheckUsergift(user,name,number){
            /* 向userGift表中添加数据 */

            let isExist = false;
            for(let u of this.userGifts){
                if(u.user === user){
                    isExist = true; //用户已存在
                    if(u[name]){
                        u[name]+=number;
                    }else{
                        u[name] = number;
                    }
                }
            }
            if(!isExist){
                let s = {};
                s.user = user;
                s[name] = number;
                this.userGifts.push(s);
            }
            //console.log(this.userGifts);
        },
    },
}
</script>

<style>

</style>
