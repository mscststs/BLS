<template>
    <div class="clackroom-block">
        <el-row :gutter="20">
          <el-col :span="24">
              <el-form :model="form" inline>
                <el-form-item label="禁止时间段">
                    <el-input v-model="form.input" disabled></el-input>
                </el-form-item>
                <el-form-item label="小电视回避">
                    <el-switch v-model="form.smalltv"></el-switch>
                </el-form-item>
                <el-form-item label="活动抽奖回避">
                    <el-switch v-model="form.raffle"></el-switch>
                </el-form-item>
                <el-form-item label="保持在线回避">
                    <el-switch v-model="form.online"></el-switch>
                </el-form-item>
              </el-form>
          </el-col>
          <el-col :span="24">
              <el-slider
                    v-model="form.time"
                    range
                    :show-tooltip="true"
                    @change="UpdateValue"
                    :min="0"
                    :step="1"
                    :max="24">
                </el-slider>
          </el-col>
        </el-row>
    </div>
</template>

<script>
export default {
    data(){
        return{
            form:{
                time:[1,9],
                input:"01:00 ~ 09:00",
                smalltv:true,
                raffle:true,
                online:true
            }
        };
    },
    watch:{

    },
    mounted(){
        this.Addlistener();
        
    },
    methods:{
        Addlistener(){
            this.$eve.on("dm_SmallTv",()=>{
                if(this.form.smalltv && this.isBlockTime()){
                    this.BlockInfo("小电视/摩天大楼抽奖");
                    return false;
                }
            },-9);
            this.$eve.on("dm_raffle",()=>{
                if(this.form.raffle && this.isBlockTime()){
                    this.BlockInfo("活动抽奖");
                    return false;
                }
            },-9);
            this.$eve.on("HeartBeat",()=>{
                if(this.form.online && this.isBlockTime()){
                    this.BlockInfo("保持在线");
                    return false;
                }
            },-9);
        },
        BlockInfo(type){
            this.$eve.emit("info",`<- 小黑屋回避 -> 拦截了一个 ${type}`);
        },
        UpdateValue(){
            this.form.input = `${(this.form.time[0]<10?"0":"")+this.form.time[0]}:00 ~ ${(this.form.time[1]<10?"0":"")+this.form.time[1]}:00`
        },
        isBlockTime(){
            let da = new Date();
            let NowHour = da.getHours();
            if(NowHour>=this.form.time[0] && NowHour<this.form.time[1]){
                return true;
            }
            return false;
        }
    },
}
</script>

<style>

</style>
