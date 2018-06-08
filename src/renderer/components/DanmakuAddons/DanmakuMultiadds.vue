<template>
    <div class="Danmaku-Multiadds" :class="{Danmaku_Multiadds_active:Expand.ex}">

        <div class="square" v-for="s in Square" :key="s.name" v-show="Expand.ex">
            <div class="square-title">
                {{s.name}}<el-switch v-model="s.dm.allow" style="margin:-5px 5px 0px 5px;"></el-switch>
            </div>
            <div class="square-status">
                <span class="square-status-roomid">{{s.dm.roomid}}</span>{{s.dm.allow?s.dm.status?"已连接":"已断开":"不监听"}}
            </div>
            
        </div>
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
            allow:false,
            Expand:{
                ex:false,
                icon : "el-icon-d-arrow-right"
            },
            Square:[
                {
                    name:"娱乐",
                    type:1,
                    dm:{},
                },
                {
                    name:"游戏",
                    type:2,
                    dm:{},
                },
                {
                    name:"手游",
                    type:3,
                    dm:{},
                },
                {
                    name:"绘画",
                    type:4,
                    dm:{},
                },
            ]
        };
    },
    mounted(){
        for(let s of this.Square){
            s.dm = new dm(s.type,s.name);
            s.dm.connect();
        }
    },
    methods:{
        Addlistener(){
            
        },
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
        overflow: hidden;
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
    .square{
        float: left;
        display: block;
        margin: 0 10px;
        box-shadow: 0 -5px 7px rgba(0,0,0,0.3);
        padding: 7px 15px;
        margin-bottom:100px;
    }
    .square-title{
        color:black;
        font-family: 'Courier New', Courier, monospace;
        
    }
    .square-status{
        margin-top: 5px;
        font-size: 14px;
    }
    .square-status-roomid{
        margin-right: 4px;
        border-radius: 3px;
        color:rgb(15, 68, 42);
        border:1px solid rgb(15, 68, 42);
        padding: 0 3px;
        background-color:rgb(197, 238, 218);
    }
</style>
