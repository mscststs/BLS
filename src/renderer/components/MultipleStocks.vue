<template>
  <div class="main">
    <el-tabs @tab-click="resetIndex" type="border-card" v-bind:value="selected" tab-position="left" style="height:100%">
      <el-tab-pane label="自定义" name="自定义">
        <custom></custom>
      </el-tab-pane>
      <el-tab-pane label="Mock" name="Mock">
        <mock></mock>
      </el-tab-pane>
      <el-tab-pane label="配置中心" name="配置中心">
        <config-center></config-center>
      </el-tab-pane>
      <el-tab-pane label="定时任务" name="定时任务">
        <interval-task></interval-task>
      </el-tab-pane>
      <el-tab-pane label="触发任务" name="触发任务">
        <trigger-task></trigger-task>
      </el-tab-pane>
      <el-tab-pane label="统计中心" name="统计中心">
        <count-center></count-center>
      </el-tab-pane>
      <el-tab-pane label="调度响应" name="调度响应">
        <response-center></response-center>
      </el-tab-pane>
      <el-tab-pane label="小黑屋回避" name="小黑屋回避">
        <blackroom-block></blackroom-block>
      </el-tab-pane>
      <el-tab-pane label="代理设置" name="代理设置">
        <agent-proxy></agent-proxy>
      </el-tab-pane>
      <el-tab-pane label="关于" name="关于">
        <about></about>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script>
/* 功能分块逻辑 */

import About from "@/components/stocks/About"
import Custom from "@/components/stocks/Custom"
import ResponseCenter from "@/components/stocks/ResponseCenter"
import ConfigCenter from "@/components/stocks/ConfigCenter"
import IntervalTask from "@/components/stocks/IntervalTask"
import TriggerTask from "@/components/stocks/TriggerTask"
import Mock from "@/components/stocks/Mock"
import CountCenter from "@/components/stocks/CountCenter"
import BlackroomBlock from "@/components/stocks/BlackroomBlock"
import AgentProxy from "@/components/stocks/AgentProxy"

export default {
  name:"MultipleStocks",
  data(){
      return {
        stocks : [
          "自定义",
          "Mock",
          "配置中心",
          "定时任务",
          "触发任务",
          "统计中心",
          "调度响应",
          "小黑屋回避",
          "代理设置",
          "关于",
        ],
        selected:"自定义",
      }
  },
  components:{
    Custom, //自定义
    Mock,//Mock
    ConfigCenter, //配置中心
    IntervalTask, //定时任务
    TriggerTask, //触发任务
    CountCenter, //统计中心
    ResponseCenter, //调度响应
    BlackroomBlock, //小黑屋回避
    AgentProxy, //代理设置
    About, //关于
  },
  mounted(){
    this.addListener();
  },
  methods:{
    resetIndex(panel){
      /* 此处有一个注意点，Tab组件的value属性并非双向绑定，必须添加tab-click事件为value做重新赋值！ */
      this.selected = panel.name;
      this.$eve.emit("tabChanged",panel.name);
    },
    addListener(){
      this.$eve.on("selectTab",(name)=>{
        if(this.stocks.indexOf(name) >=0 ){
          /* 判断事件是否有效 */
          this.selected = name;
        }else{
          this.$eve.emit("error",`选项卡监听到了一个意外指令 ${name}`);
        }
      });
    }
  },
}
</script>
<style scoped>
.main{
  width:100%;
  height:calc(100% - 55px) ;
  overflow: hidden;
}
</style>
