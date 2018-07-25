<template>
    <div class="highperformance">
        <el-row :gutter="20">
            <el-col :span="24">
                <el-alert type="warning" title="" :closable="false">高并发 与 代理设置 不推荐同时使用</el-alert>
            </el-col>
            <el-col :span="4" style="margin-top:10px;" v-show="!control.init">
                <el-button type="primary" size="small" @click="initDNSList" plain>初始化</el-button> 
            </el-col>
            <el-col :span="20" style="margin-top:10px;" v-show="!control.init">
                <el-alert type="info" title="" :closable="false">首先需要初始化可用DNS列表</el-alert>
            </el-col>
            <el-col :span="24" v-show="control.init">
                <div class="control">
                    <el-row>
                        <el-col :span="12">
                            <el-switch v-model="control.HighPerformance" 
                            active-text="开启高并发模式"></el-switch>
                        </el-col>
                        <el-col :span="12">
                            <el-switch v-model="control.HackAPI" 
                            active-text="开启小黑屋穿透"></el-switch>
                        </el-col>
                    </el-row>
                </div>
            </el-col>
            <el-col :span="24">

            </el-col>
        </el-row>
    </div>
</template>

<script>
export default {
    name:"HighPerformance",
    data(){
        return{
            OriginCDNs:[
                "111.231.211.246",
                "111.230.84.45",
                "140.249.9.4",
                "59.53.86.4",
                "111.230.85.89",
                "122.228.77.85",
                "27.221.61.100",
                "193.112.239.119",
                "112.117.218.167",
                "114.80.223.172",
                "120.92.174.135",
                "113.133.46.196",
                "118.89.74.45",
                "114.80.223.177",
                "111.230.84.59",
                "61.147.236.15",
                "118.89.74.220",
                "120.92.78.97",
                "140.143.82.138",
                "111.231.212.88",
                "140.249.9.7",
                "112.25.54.213",
                "27.221.61.109",
                "170.33.36.101",
                "211.159.214.11",
                "218.98.33.197",
                "221.13.201.9",
                "221.204.199.135",
                "122.143.15.150",
                "113.207.83.212",
                "120.192.82.106",
                "111.6.174.4",
                "112.49.19.4",
                "111.1.27.36",
                "58.222.35.205",
                "120.92.113.99",
                "58.222.35.202",
                "120.92.82.179",
                "120.92.83.126",
            ],
            control:{
                init:false,
                HighPerformance:false,
                HackAPI:false,
            },
            CDNStatus:[],
        }
    },
    mounted(){
        this.init();
    },
    methods:{
        initDNSList(){
            
            this.control.init = true;
        },
        init(){
            if(this.$store.data.HighPerformance && this.$store.data.HighPerformance.HighPerformance){
                this.control.HighPerformance.HighPerformance = true;
            }
        },
    },
}
</script>

<style>
.highperformance .control{
    margin-top:15px;
}
</style>
