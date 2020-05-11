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
        <el-col :span="24" style="padding:3px 3px;">
            <el-form inline>
                <el-form-item label="显示更新时间">
                    <el-switch v-model="lastUpdateSwitch"></el-switch>
                </el-form-item>
            </el-form>
        </el-col>
    </el-row>
    <div ref="CountCenter">
        <el-table :data="userGifts" ref="CountTable" :cell-style="{padding:'3px 0'}">
            <el-table-column prop="user" label="用户">

            </el-table-column>
            <el-table-column v-for="tp in types" :key="tp" :prop="tp" :label="tp">

                <template slot-scope="scope">
                    {{scope.row[tp]}}
                    <span style="color:#aaa;font-family:mono">{{getUpdateTime(scope.row,tp)}}</span>
                </template>
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
            lastUpdateMap : {},
            lastUpdateSwitch: false,
        }
    },
    beforeDestroy() {
        this.Httpserver.close() 
    },
    mounted(){
        this.AddListenner();
        this.setTask();
        this.lastUpdateSwitch = this.$store.data.lastUpdateSwitch || false; // 默认值
        if(this.$store.data.serverConfig){
            this.serverConfig = this.$store.data.serverConfig;
            if(this.serverConfig.open){
                this.ChangeServerStatus(true)
            }
        }
    },
    watch:{
        lastUpdateSwitch(newVal){
            this.$store.update(data=>{
                data.lastUpdateSwitch = newVal
            })
        },
        "serverConfig":{
            handler(newVal){
                this.$store.update(data=>{
                    data.serverConfig = newVal
                })
            },
            deep:true,
        }
    },
    methods:{
        getUpdateTime(row,tp){
            if(!this.lastUpdateSwitch){
                return ""
            }else{
                let ts = {}
                let {user} = row;
                let time = this.lastUpdateMap[`${user}_++_${tp}`]
                time = time ? `(${time})` : "";
                return time
            }

        },
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
                        u[name] += number;
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
            this.lastUpdateMap[`${user}_++_${name}`] = this.formatTime(new Date(),"HH:mm"); // 记录更新时间
            //console.log(this.userGifts);
        },
        formatTime(date = new Date(), fmt = "YYYY-MM-DD HH:mm:ss") {
            date = typeof date === "number" ? new Date(date) : date;
            var o = {
            "M+": date.getMonth() + 1,
            "D+": date.getDate(),
            "h+": date.getHours() % 12 === 0 ? 12 : date.getHours() % 12,
            "H+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds(),
            "q+": Math.floor((date.getMonth() + 3) / 3),
            S: date.getMilliseconds()
            };
            var week = {
            "0": "\u65e5",
            "1": "\u4e00",
            "2": "\u4e8c",
            "3": "\u4e09",
            "4": "\u56db",
            "5": "\u4e94",
            "6": "\u516d"
            };
            if (/(Y+)/.test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1,
                (date.getFullYear() + "").substr(4 - RegExp.$1.length)
            );
            }
            if (/(E+)/.test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1,
                (RegExp.$1.length > 1
                ? RegExp.$1.length > 2 ? "\u661f\u671f" : "\u5468"
                : "") + week[date.getDay() + ""]
            );
            }
            for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(
                RegExp.$1,
                RegExp.$1.length === 1
                    ? o[k]
                    : ("00" + o[k]).substr(("" + o[k]).length)
                );
            }
            }
            return fmt;
        }
    },
}
</script>

<style>

</style>
