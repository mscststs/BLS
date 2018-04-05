<template>
    <div>
        <el-table :data="userGifts" ref="CountTable" :cell-style="{padding:'3px 0'}">
            <el-table-column prop="user" label="用户">

            </el-table-column>
            <el-table-column v-for="tp in types" :key="tp" :prop="tp" :label="tp">

            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import { CronJob } from "cron";
export default {
    name:"CountCenter",
    data(){
        return{
            types:[],
            userGifts:[],
        }
    },
    mounted(){
        this.AddListenner();
        this.setTask();
    },
    methods:{
        setTask(){
            let dailyjob = new CronJob(
                "00 00 00 * * *",
                () => {
                    //每天凌晨0点清空
                    this.types = [];
                    this.userGifts = [];
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
                this.$refs.CountTable.doLayout();
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
