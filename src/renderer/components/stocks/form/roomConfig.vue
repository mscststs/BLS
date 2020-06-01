<template>
    <div class="roomConfig">
        <el-input
            :placeholder="placeholder"
            :size="size"
            :value="formValue"
            readonly
            @focus="showDialog"
            ref="formInput">
        </el-input>
        <el-dialog title="送礼优先级配置" 
        width="90vw"
            :close-on-click-modal="false"
            :visible.sync="dialogVisible">
            <p>
                第一优先级: 
                <el-tag 
                        v-for="medal in step1_medals"
                        :key="medal.roomid"
                        size="mini"
                        type=""
                        effect="dark"
                        :hit="false"
                        :style="{color:'#ffffff','marginRight':'3px'}"
                        :color="'#'+(medal.color).toString(16)"
                    >{{medal.medal_name}}</el-tag>
            </p>
            <p>
                第二优先级:
                <el-tag 
                        v-for="medal in step2_medals"
                        :key="medal.roomid"
                        size="mini"
                        type=""
                        effect="dark"
                        :hit="false"
                        :style="{color:'#ffffff','marginRight':'3px'}"
                        :color="'#'+(medal.color).toString(16)"
                    >{{medal.medal_name}}</el-tag>
            </p>
            <p>
                第三优先级:
                <el-input 
                style="width:50%;"
                v-model="form.step3"
                size="mini" 
                placeholder="一个房间号，该房间用于处理所有未用完的一天内辣条">

                </el-input>
            </p>
            <el-table ref="table" :data="fansMedalList"  :cell-style='{padding:"1px 0"}' style="width:100%;"
            >
                <el-table-column label="勋章名称" >
                <template slot-scope="scope">
                    <el-tag 
                        size="mini"
                        type=""
                        effect="dark"
                        :hit="false"
                        :style="{color:'#ffffff'}"
                        :color="'#'+(scope.row.color).toString(16)"
                    >{{scope.row.medal_name}}</el-tag>
                </template>
                </el-table-column>
                <el-table-column
                    prop="level"
                    label="等级"
                ></el-table-column>
                <el-table-column label="今日上限">
                    <template slot-scope="scope">
                        <div style="font-size:0.8em">
                            {{scope.row.today_feed}}/{{scope.row.dayLimit}}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="升级进度">
                    <template slot-scope="scope">
                        <div style="font-size:0.8em">
                            {{scope.row.intimacy}}/{{scope.row.next_intimacy}}
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="第一优先级">
                    <template slot-scope="scope" v-if="!~form.step2.indexOf(scope.row.roomid)">
                        <el-button 
                            v-if="!~form.step1.indexOf(scope.row.roomid)"
                            type="primary" 
                            size="mini"
                            @click="push(scope.row,'step1')">
                            添加
                        </el-button>
                        <el-button
                            v-else
                            type="danger"
                            size="mini"
                            @click="remove(scope.row,'step1')"
                            >
                            移除
                        </el-button>
                    </template>
                </el-table-column>
                <el-table-column label="第二优先级">
                    <template slot-scope="scope" v-if="!~form.step1.indexOf(scope.row.roomid)">
                        <el-button 
                            v-if="!~form.step2.indexOf(scope.row.roomid)"
                            type="primary" 
                            size="mini"
                            @click="push(scope.row,'step2')">
                            添加
                        </el-button>
                        <el-button
                            v-else
                            type="danger"
                            size="mini"
                            @click="remove(scope.row,'step2')"
                            >
                            移除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            
            <el-row style="margin-top:20px">
                <el-col :span="24">
                    <el-button type="primary" size="mini" @click="save">保存</el-button>
                    <el-button type="danger" size="mini" @click="()=>{dialogVisible=false}">取消</el-button>
                </el-col>
            </el-row>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name:"roomConfig",
    props:[
        "value",
        "placeholder",
        "userName",
        "size"
    ],
    data(){
        return {
            formValue:this.value,
            form:{
                step1:[],
                step2:[],
                step3:""
            },
            dialogVisible:false,
            fansMedalList:[],
        }
    },
    mounted(){
    },
    computed:{
        step1_medals(){
            return this.form.step1.map(v=>{
                return this.fansMedalList.find(m=>m.roomid == v)
            })
        },
        step2_medals(){
            return this.form.step2.map(v=>{
                return this.fansMedalList.find(m=>m.roomid == v)
            })
        },
        user(){
            return this.$store.users.find(v=>{
                return v.name === this.userName
            })
        }
    },
    methods:{
        save(){
            let val = this.form.step1.join(",")+"|"+this.form.step2.join(",")+"|"+this.form.step3
            this.setFormValue(val)
            this.dialogVisible = false
        },
        remove(row,obj){
            this.form[obj] = this.form[obj].filter(v=>{
                return v != row.roomid
            })
        },
        push(row,obj){
            this.form[obj].push(row.roomid)
        },
        parseValueToArray(){
            let [step1_str="",step2_str="",step3_str=""] = this.formValue.split("|")
            this.form.step1 = step1_str.split(",").map(v=>parseInt(v)).filter(v=>{
                return v.length!=0
            }).filter(v=>{
                return ~this.fansMedalList.map(v=>v.roomid).indexOf(v)
            })
            this.form.step2 = step2_str.split(",").map(v=>parseInt(v)).filter(v=>{
                return v.length!=0
            }).filter(v=>{
                return ~this.fansMedalList.map(v=>v.roomid).indexOf(v)
            })
            this.form.step3 = step3_str
        },
        async fetchMedal(){
            let {data:{fansMedalList}} = await this.$api.use(this.user).send("i/api/medal?page=1&pageSize=30")
            fansMedalList.sort((a,b)=>{
                return b.level - a.level
            })
            this.fansMedalList = fansMedalList;
        },
        setFormValue(value){
            this.formValue = value
            this.$emit("input",value)
            this.$emit("change",value)
        },
        rejectInput(e){
            return false
        },
        // 拉取用户数据和
        async showDialog(){
            this.$refs.formInput.blur()
            await this.fetchMedal();
            this.parseValueToArray()


            // Show Dialog 
            this.dialogVisible = true;
            this.$nextTick(()=>{
                this.$refs.table.doLayout()
            })
        }
    }
}
</script>

<style scoped>
    p{
        user-select:text;
    }
    .el-tag{
        border-radius:0;
        border:none;
    }
    .el-button{
        border-radius:0;
        border:none;

    }
</style>