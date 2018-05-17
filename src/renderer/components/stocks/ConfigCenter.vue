<template>
    <div class="config-center">
        <el-table :data="config" stripe style="width:100%;">
          <el-table-column
                prop="name"
                label="昵称"
                >
            </el-table-column>
            <el-table-column label="每日签到">
                <template slot-scope="scope">
                    <el-switch v-model="scope.row.DailySign" @change="HandleChanged"></el-switch>
                </template>
            </el-table-column>
            <el-table-column label="每日宝箱">
                <template slot-scope="scope">
                    <el-switch v-model="scope.row.SilverBox" @change="HandleChanged"></el-switch>
                </template>
            </el-table-column>
            <el-table-column label="银瓜子换硬币">
                <template slot-scope="scope">
                    <el-switch v-model="scope.row.Silver2Coin" @change="HandleChanged"></el-switch>
                </template>
            </el-table-column>
            <el-table-column label="保持在线">
                <template slot-scope="scope">
                    <el-switch v-model="scope.row.KeepAlive" @change="HandleChanged"></el-switch>
                </template>
            </el-table-column>
            <el-table-column label="小电视">
                <template slot-scope="scope">
                    <el-switch v-model="scope.row.SmallTv" @change="HandleChanged"></el-switch>
                </template>
            </el-table-column>
            <el-table-column label="高能抽奖">
                <template slot-scope="scope">
                    <el-switch v-model="scope.row.Raffle" @change="HandleChanged"></el-switch>
                </template>
            </el-table-column>
            <el-table-column label="手机高能">
                <template slot-scope="scope">
                    <el-switch v-model="scope.row.AppRaffle" @change="HandleChanged"></el-switch>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<script>
export default {
  name: "ConfigCenter",
  data() {
    return {
      config: [],
    };
  },
  mounted() {
    this.initConfig();
    this.AddListener();
  },
  methods: {
    initConfig() {
        this.config = [];//清空配置
        let configs=[
            //可配置项清单，由于不需要外部干预，所以不需要另外写了，直接写在堆里
            "DailySign",
            "SilverBox",
            "Silver2Coin",
            "KeepAlive",
            "SmallTv",
            "Raffle",
            "AppRaffle",
        ];

        let reUpdateFlag = false;
        let StoredConfig;
        if(this.$store.data.config){
            StoredConfig = this.$store.data.config;
        }else{
            reUpdateFlag = true;
            StoredConfig = [];
        };
        for(let user of this.$store.users){

            let StoredUserConfig = null;

            for(let suc of StoredConfig){
                if(suc.name===user.name){
                    StoredUserConfig = suc;
                    break;
                }
            }
            if(StoredUserConfig ===null){
                StoredUserConfig={};
            }

            /* let myConfig = {
                name:user.name,
                dailySign:StoredUserConfig.dailySign||false,
                KeepAlive:StoredUserConfig.KeepAlive||false,
                SmallTv:StoredUserConfig.SmallTv||false,
                Raffle:StoredUserConfig.Raffle||false,
                AppRaffle:StoredUserConfig.AppRaffle||false,
            } */
            let myConfig={
                name:user.name,
            };
            for(let cf of configs){
                if(StoredUserConfig[cf]){
                    myConfig[cf] = true;
                }else{
                    myConfig[cf] = false;
                }
                  //这个想法还行，undefined和false的都会false，反正也不影响
            }
            this.config.push(myConfig);

            /* 用于找出StoredConfig中用户配置 */
        }





        if(reUpdateFlag){
            /* 在初始化过程中检查出Store的config信息存在不完善 */
            this.StoreConfig();
        }
        this.RefactToUsers();//完成装配后写入user中
    },
    RefactToUsers(){
        for(let cf of this.config){
            for(let user of this.$store.users){
                if(cf.name==user.name){
                    user.config = cf;
                    
                    //保存到user中，以便其他组件能够查阅,省得每次都要查store，所以这边有个失误，其实之前就把config写在user里面就好了
                    //= =emm，之前是怎么想来着，貌似是想要做成插件式的，结果越写越集中了
                    break;
                }
            }
        }
    },
    HandleChanged(){
        // 状态切换事件，需要进行保存和状态切换
        this.StoreConfig();
        this.RefactToUsers();
    },
    StoreConfig() {
      this.$store.update(data => {
          data.config = this.config;
      });
    },
    AddListener() {
        this.$eve.on("configUpdated",()=>{
            /* 其他地方改变config的时候需要emit configUpdated事件 */
            this.initConfig(); 
        });
        this.$eve.on("userListUpdated",()=>{
            
            /* 用户列表变化的时候也需要同时改变config
                由于用户列表初始化的时候会多次触发这个事件，因此不需要另外初始化
            */
            this.initConfig();
        });

    }



  }
};
</script>


<style scoped>

</style>
