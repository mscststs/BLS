<template>
    <div class="Danmaku-Multiadds" :class="{Danmaku_Multiadds_active:Expand.ex}">


        <div class="expand"  @click="expandPanel">
            <i :class="Expand.icon"></i>
        </div>
    </div>
</template>


<script>
import dm from "./MultiaddsListener";

export default {
    name:"DanmakuMultiadds",
    data(){
        return{
            Expand:{
                ex:false,
                icon : "el-icon-d-arrow-right"
            },
        };
    },
    mounted(){
        let s = new dm(1);
        s.getOnlineRoom();
    },
    methods:{
        expandPanel(){
            this.Expand.ex = !this.Expand.ex;
            this.Expand.icon=!this.Expand.ex?"el-icon-d-arrow-right":"el-icon-d-arrow-left";
        }
    },
}
</script>

<style>
    .Danmaku-Multiadds{
        position:fixed;
        background-color: rgb(241, 253, 247);
        float: right;
        width: 0;
        height:55px;
        box-shadow: 0px 0 6px 0 #aaa inset;
        transition: width 0.5s;
    }
    .Danmaku_Multiadds_active{
        position:fixed;
        width: 100%;
    }
    .expand{
        position: fixed;
        line-height: 55px;
        height:55px;
        background-color:rgba(0,0,0,0.1);
        box-shadow: -4px -2px 8px rgba(0,0,0,0.3);
        right:0;
        
        padding: 0 3px;
        transition: background-color 0.5s,
                    color 0.5s;
        
    }
    .expand:hover{
        background-color:rgba(0,0,0,0.4);
        color:#fff;
    }
</style>
