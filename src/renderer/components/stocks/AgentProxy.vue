<template>
    <div class="agent-proxy">
        <el-row :gutter="20">
            <el-col :span="24">
                <el-form :model="Settings" >
                    <el-form-item label="代理" label-width="50px">
                        <el-input v-model="Settings.ProxyString" placeholder=" http://localhost:1080  详细分类见下表"></el-input>
                    </el-form-item>
                    <el-form-item label="类型" label-width="50px">
                        <el-switch v-model="Settings.Global"
                        active-text="全局代理" :disabled="Settings.connect">
                        </el-switch>
                        <el-tag type="warning">启用全局代理后将会代理所有的HTTP(s)请求,否则仅代理用户的请求</el-tag>
                    </el-form-item>
                    <el-form-item label="连接" label-width="50px">
                        <el-switch v-model="Settings.connect" @change="Changestatus"></el-switch>
                        <span v-show="Settings.connect">
                            {{detail.country}} {{detail.province}} {{detail.city}} {{detail.isp}}
                        </span>
                    </el-form-item>
                </el-form>
            </el-col>
            <el-col :span="24" style="margin-top:20px">
                <table class="example" >
                    <thead>
                        <tr>
                        <th style="text-align:center" colspan="2">配置样例</th>
                        </tr>
                    </thead>
                    <thead>
                        <tr>
                            <th style="text-align:left">Protocol</th>
                            <th style="text-align:left">Example</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="text-align:left"><code>http</code></td>
                            <td style="text-align:left"><code>http://proxy-server-over-tcp.com:3128</code></td>
                        </tr>
                        <tr>
                            <td style="text-align:left"><code>https</code></td>
                            <td style="text-align:left"><code>https://proxy-server-over-tls.com:3129</code></td>
                        </tr>
                        <tr>
                            <td style="text-align:left"><code>socks(v5)</code></td>
                            <td style="text-align:left"><code>socks://username:password@some-socks-proxy.com:9050</code> (username &amp; password 是可选的)</td>
                        </tr>
                        <tr>
                            <td style="text-align:left"><code>socks5</code></td>
                            <td style="text-align:left"><code>socks5://username:password@some-socks-proxy.com:9050</code> (username &amp; password 是可选的)</td>
                        </tr>
                        <tr>
                            <td style="text-align:left"><code>socks4</code></td>
                            <td style="text-align:left"><code>socks4://some-socks-proxy.com:9050</code></td>
                        </tr>
                        <tr>
                            <td style="text-align:left"><code>pac</code></td>
                            <td style="text-align:left"><code>pac+http://www.example.com/proxy.pac</code></td>
                        </tr>
                    </tbody>
                </table>
            </el-col>
            <el-col :span="24" style="margin-top:10px;">
                <code>
                    该代理设置不能替代 SS(ShadowSocks)、SSR 等应用层代理软件，需要先使用SS客户端启动本地代理才能使用;
                    <br>SS的本地代理和其他类型的代理按照上表填写配置即可.
                </code>
            </el-col>
        </el-row>
    </div>
</template>

<script>
export default {
  name: "AgentProxy",
  data() {
    return {
      Settings: {
        ProxyString: "",
        Global:false,
        connect: false
      },
      detail:{

      }
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      if (this.$store.data.Agent) {
        this.Settings.ProxyString = this.$store.data.Agent.agent;
        this.Settings.Global = this.$store.data.Agent.Global;
        if (this.$store.data.Agent.status) {
          this.open();
        }
      }
    },
    async open() {
      let raw = await this.$api.TestAndSetProxy(this.Settings.ProxyString);
      if(raw.useful){

          this.$eve.emit("success","代理连接成功");
          this.Settings.connect = true;
          this.detail = raw.rq.data;
          
          //设置是否全局代理
          this.$api.Agent.Global = this.Settings.Global;
          return true;
      }else{
          return false;
      }
      
    },
    close(){
        this.$api.Agent.status = false;
    },
    async Changestatus(e) {
      if (e) {
        //opend
        let s = await this.open();
        if (s) {
          this.$store.update(data => {
            data.Agent = {
              agent: this.Settings.ProxyString,
              Global:this.Settings.Global,
              status: true
            };
          });
        }else{
            this.Settings.connect = false;
        }
      } else {
        //closed
        this.close();
        this.detail = {};
        this.$store.update(data => {
          if (data.Agent) {
            data.Agent.status = false;
          }
        });
      }
    }
  }
};
</script>

<style>
table.example {
  border-collapse: collapse;
}
table.example td,
table.example th {
  border: 1px solid #000;
  padding: 2px 3px;
}
</style>
