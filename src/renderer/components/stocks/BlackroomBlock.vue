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
                    show-stops
                    @change="UpdateValue"
                    :min="0"
                    :step="1"
                    :max="24">
                </el-slider>
          </el-col>
          <el-col :span="24" style="margin-top:24px">
              <div id="Heatmap">

              </div>
          </el-col>
        </el-row>
    </div>
</template>

<script>
import echarts from "echarts"

export default {
    data(){
        return{
            myChart:{},
            form:{
                time:[1,9],
                input:"01:00 ~ 09:00",
                smalltv:true,
                raffle:true,
                online:true
            },
            count:{
                smalltv:{
                    name:'小电视',
                    type:'line',
                    data:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                },
                mtdl:{
                    name:'摩天大楼',
                    type:'line',
                    data:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                },
                raffle:{
                    name:'活动抽奖',
                    type:'line',
                    data:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                },
                TimeFlag:[

                ],
            }
        };
    },
    watch:{

    },
    mounted(){
        this.Addlistener();
        this.DrawHeatMap(true);
    },
    methods:{
        Addlistener(){
            this.$eve.on("dm_SmallTv",(data)=>{
                this.HeatResolve(data);
                if(this.form.smalltv && this.isBlockTime()){
                    this.BlockInfo("小电视/摩天大楼抽奖");
                    return false;
                }
            },-9);
            this.$eve.on("dm_raffle",(data)=>{
                this.HeatResolve(data);
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

            this.$eve.on("tabChanged",(name)=>{
                //界面重排，防止挤在一起。
                if(name=="小黑屋回避"){
                    setTimeout(()=>{
                        this.myChart.resize();
                    },100);
                }
            });
        },
        HeatResolve(data){
            console.log("???");
            if(data.msg.indexOf("小电视")>=0){
                //小电视
                this.Heatmark(this.count.smalltv)
            }else if(data.msg.indexOf("摩天大楼")>=0){
                //摩天大楼
                this.Heatmark(this.count.mtdl)
            }else{
                //活动抽奖
                this.Heatmark(this.count.raffle)
            }
        },
        Heatmark(type){
            console.log("~!!!");
            let da = new Date();
            let NowHour = da.getHours();
            let date =da.getDate();

            let Found = false;
            let NeedClear = false;
            for(let hour of this.count.TimeFlag){
                //遍历所有的时间选项，重置24小时时间
                if(hour.h == NowHour ){
                    Found = true;
                    if(hour.d !=date){
                        NeedClear = true;
                        hour.d = date;
                        break;
                    }
                }
            }
            if(!Found){
                this.count.TimeFlag.push({
                    h:NowHour,
                    d:date,
                })
            };
            if(NeedClear){
                this.count.smalltv.data[NowHour] = 0;
                this.count.mtdl.data[NowHour] = 0;
                this.count.raffle.data[NowHour] = 0;
            };

            type.data[NowHour] ++;
            this.DrawHeatMap();
        },
        DrawHeatMap(init=true){
            let hours = ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23'];
            let option = {
                title : {
                    text: '24小时抽奖分布',
                    subtext: '参考'
                },
                tooltip : {
                    trigger: 'axis'
                },
                legend: {
                    data:['小电视','摩天大楼','活动抽奖']
                },
                toolbox: {
                    show : true,
                    feature : {
                        mark : {show: true},
                        dataView : {show: false, readOnly: false},
                        magicType : {show: true, type: ['line', 'bar']},
                        restore : {show: true},
                        saveAsImage : {show: false}
                    }
                },
                calculable : true,
                xAxis : [
                    {
                        type : 'category',
                        boundaryGap : false,
                        data : hours
                    }
                ],
                yAxis : [
                    {
                        type : 'value',
                    }
                ],
                series : [
                    this.count.smalltv,
                    this.count.mtdl,
                    this.count.raffle
                ]
            };
                    
            if(init){
                this.myChart = echarts.init(document.getElementById('Heatmap'))
                window.addEventListener("resize", this.myChart.resize);
            }
            // 绘制图表
            this.myChart.setOption(option);
            
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
    #Heatmap{
        display: block;
        width: 100%;
        height:400px;

    }

</style>
