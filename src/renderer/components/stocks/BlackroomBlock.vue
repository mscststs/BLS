<template>
    <div class="clackroom-block">
        <el-row :gutter="20">
          <el-col :span="24">
              <el-form :model="form" inline>
                <el-form-item label="禁止时间段">
                      <el-time-picker
                        is-range
                        arrow-control
                        v-model="form.time"
                        range-separator="至"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                        placeholder="选择时间范围">
                    </el-time-picker>
                    <el-button type="success" @click="BlockTime">回避该时段</el-button>
                </el-form-item>
              </el-form>
          </el-col>
          <el-col :span="24" style="margin-bottom:14px;">
              <div class="block-time" v-for="time in BlockTimeList" :key="time.desc">
                  {{time.desc}} <el-button type="primary" plain size="small" @click="RemoveTimeBlock(time)"> X </el-button>
              </div>
          </el-col>
          <el-col :span="24">
              <el-form :model="form" inline>
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
            BlockTimeList:[],
            myChart:{},
            form:{
                time:[new Date(),new Date()],
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
        this.BlockTimeList = this.$store.data.BlockTimeList || [];
    },
    methods:{
        RemoveTimeBlock(time){
            let n = [];
            for(let t of this.BlockTimeList){
                if(t.desc == time.desc){

                }else{
                    n.push(t);
                }
            }
            this.BlockTimeList = n;
            this.$store.update(data=>{
                data.BlockTimeList=  this.BlockTimeList;
            })
        },
        getSeconds(time){
            let hour = time.getHours();
            let minute = time.getMinutes();
            let second = time.getSeconds();
            return ((hour*60)+minute)*60+second; //得到相对于0点0分0秒的偏移值
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
        },
        BlockTime(){
            let Time1 = this.form.time[0];
            let Time2 = this.form.time[1];
            if(Time1 && Time1.getHours && typeof Time1.getHours == "function"){
                if(this.getSeconds(Time1)>=this.getSeconds(Time2)){
                    this.$eve.emit("error","时间不合法");
                }else{
                    let s = {
                        min:this.getSeconds(Time1),
                        max:this.getSeconds(Time2),
                        desc:`${this.formatTime(Time1,"HH:mm:ss")} - ${this.formatTime(Time2,"HH:mm:ss")}`,
                    };
                    this.RemoveTimeBlock(s);
                    //防止创建同样的规则

                    this.BlockTimeList.push(s);
                    this.BlockTimeList.sort((a,b)=>a.min-b.min);

                    this.$store.update(data=>{
                        data.BlockTimeList = this.BlockTimeList;
                    });
                }
            }
        },
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
        isBlockTime(time = new Date()){
            let sec = this.getSeconds(time);
            for(let rg of this.BlockTimeList){
                if(sec>=rg.min && sec <rg.max){
                    return true;
                }
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
    div.block-time{
        display: inline-block;
        padding: 3px 7px;
        font-size: 14px;
        background-color: #e5f1fa;
        margin-right: 14px;
        margin-bottom:3px;
        color:#000;
        border-radius: 4px;
    }

</style>
