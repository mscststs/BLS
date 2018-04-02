<template>
<div class="UserconfigPanel">
  <el-dialog title="添加用户" :visible.sync="Nuser.FormVisisble">
  <el-form :model="Nuser">
    <el-form-item label="">
      <el-alert type="warning" title="请确保密码正确，错误次数过多将引发验证码策略"></el-alert>
    </el-form-item>
    
    <el-form-item label="登录ID" label-width="120px">
      <el-input v-model="Nuser.id" auto-complete="off"></el-input>
    </el-form-item>
    <el-form-item label="密码" label-width="120px">
      <el-input type="password" v-model="Nuser.password" auto-complete="off"></el-input>
    </el-form-item>
    <el-form-item label="昵称" label-width="120px">
      <el-input v-model="Nuser.name" auto-complete="off"></el-input>
    </el-form-item>
  </el-form>
  <div slot="footer" class="dialog-footer">
    <el-button @click="Nuser.FormVisisble = false">取 消</el-button>
    <el-button type="primary" @click="addUser()" :loading="Nuser.load">确 定</el-button>
  </div>
</el-dialog>

<el-row>
  <el-col :span="22" :offset="1" style="padding:5px 0">
    <el-button type="primary" plain size="small" @click="Nuser.FormVisisble= true" icon="el-icon-plus" :loading="Nuser.load">添加新用户</el-button>
  </el-col>
  <el-col :span="22" :offset="1">
    <el-collapse accordion v-if="users.length">
      <el-collapse-item  v-for="user in users" :key="user.id">
        <template slot="title">
          {{user.name}} 
          <i v-if="user.isLogin" class="el-icon-success" style="color:green"></i>
          <i v-else class="el-icon-error" style="color:red"></i>
        </template>
      <div style="padding:10px 0;text-align:center;box-shadow:0px 0px 3px 0px #ccc inset">
        <el-button type="primary" icon="edit" plain size="small" @click="updatePassword(user)">修改密码</el-button>
        <el-button type="warning" icon="edit" plain size="small" @click="removeUser(user)">删除</el-button>
      </div>
      </el-collapse-item>
    </el-collapse>
  </el-col>
</el-row>


</div>
</template>
<script>
/* 用户逻辑 */

import user from "~/tools/user";
import { throws } from "assert";

export default {
  name: "UserConfig",
  data() {
    return {
      users: [],
      Nuser: {
        FormVisisble: false,
        id: "",
        password: "",
        name: "",
        load: false
      }
    };
  },
  mounted() {
    this.addListener();
    this.initUser();
  },
  methods: {
    addListener() {
      this.$eve.on("userListUpdated", () => {
        this.users =[];
        this.users =  this.$store.users;
      });
    },
    async initUser() {
      this.Nuser.load = true;

      try {
        let users = this.$store.data.users;
        for (let u of users) {
          await this.createUser(u.id, u.password, u.name);
        }
      } catch (e) {}

      this.Nuser.load = false;
    },
    async createUser(id, password, name) {
      let s = new user(id, password, window.localStorage, name);
      await s.Login();

      try {
        for (let u of this.$store.users) {
          if (u.id == s.id || u.name == s.name) {
            throw new Error("检测到重复添加用户");
          }
        }
        this.$store.users.push(s);
      } catch (e) {
        this.$message.error(`意外错误【${e.message}】可能是由调试引起`);
      }
      this.$eve.emit("userListUpdated");
    },
    removeUser(deleteuser) {
      this.$confirm(`将会删除${deleteuser.name}，是否继续?`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          let s = [];
          for (let user of this.$store.users) {
            if (user.id !== deleteuser.id) {
              s.push(user);
            }
          }
          this.$store.update((data)=>{
                let newData = []
                for(let u of data.users){
                  if(u.id===deleteuser.id){
                    
                  }else{
                    newData.push(u);
                  }
                }
                data.users = newData;
              });
              /* 更新store */

          this.$store.users = s;
          this.$eve.emit("userListUpdated");

          this.$message({
            type: "success",
            message: "删除成功!"
          });
        })
        .catch(() => {});
    },
    async updatePassword(user) {
      /* 更新用户信息 */
        this.$prompt("请输入新密码", "修改密码", {
          tyep:"info",
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          inputPlaceholder: user.password
        }).then(({value})=>{
          if(value.length){
            user.password = value;
            try{
              this.$store.update((data)=>{
                for(let u of data.users){
                  if(u.id===user.id){
                    u.password = user.password;
                  }
                }
              });
              user.Login(true);
            }catch(e){
              this.$message.error(e.message);
            }
          }
          return value;
        }).catch(()=>{

        });
    },
    async addUser() {
      if (
        this.Nuser.id.length !== 0 &&
        this.Nuser.password.length !== 0 &&
        this.Nuser.name.length !== 0
      ) {
        this.Nuser.load = true;

        try {
          /* 去重 */
          for (let user of this.users) {
            if (user.id == this.Nuser.id || user.name == this.Nuser.name) {
              throw new Error("用户已存在");
            }
          }

          /* 创建用户 */
          await this.createUser(
            this.Nuser.id,
            this.Nuser.password,
            this.Nuser.name
          );

          /* 向存储库中写入新用户数据 */
          this.$store.update(data => {
            if (!data["users"]) {
              data["users"] = [];
            }
            data["users"].push({
              id: this.Nuser.id,
              password: this.Nuser.password,
              name: this.Nuser.name
            });
          });

          this.$message({
            type: "success",
            message: "添加成功"
          });
          this.clearForm();
        } catch (e) {
          this.$message.error(e.message);
        }

        this.Nuser.load = false;
      } else {
        this.$message.error("不能为空");
      }
    },
    clearForm() {
      this.Nuser = {
        FormVisisble: false,
        id: "",
        password: "",
        name: "",
        load: false
      };
    }
  }
};
</script>

<style scoped>
.UserconfigPanel {
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px 0 0 0;
  box-shadow: -3px 0px 10px 0px rgba(0, 0, 0, 0.15) inset;
  position: relative;
  height: calc(100% - 10px);
}
.box-card {
  padding: 7px 4px;
  margin-top: 7px;
}
</style>

