import DmService from "~/tools/danmaku";
import api from "~/tools/api";
import eve from  "~/tools/events"

class dm {
    constructor(type,name) {
        this.name = name;
        this.type = type;
        this.status = false;
        this.roomid = 0;
        this.dm = {};
        this.allow = true;
        this._initConnect = false; //用于首次初始化的时候过滤HeartBeat的消息。
        eve.on("HeartBeat",()=>{
            if(this._initConnect){
                if(this.status){
                    this.CheckInType();
                }else{
                    //status 变成断开，需要重新连接
                    
                    this.roomid = 0;
                    this.CheckInType();
                }
            }
        })
    }
    async CheckInType(){
        let flag = false;
        let rq = await api.send("room/v1/area/getRoomList", {
            platform: "web",
            parent_area_id: this.type,
            sort_type: "online",
            page_size: "30",
        }, "get");

        //检查签前30热度的是否还有该主播

        for(let r of rq.data){
            if(r.roomid==this.roomid){
                flag = true;
            }
        }

        if(!flag){
            eve.emit("info",this.name + "分区检测 ：检测到房间分区/房间热度变化，自动重新选择房间");
            this.disconnect();
            this.connect();
        }else{
            //eve.emit("info",this.name + "分区检测 ：房间分区正常"); 
            //无须打印这么多正常房间消息
        }
    }
    async connect() {
        if (Object.keys(this.dm).length && this.dm._socket) {
            /* 防止多个socket并存 */
            this.disconnect();
        }

        let roomid = await this.getOnlineRoom();
        if(roomid!=0){
            this.roomid = roomid;
            this.dm = new DmService({
                roomId: roomid
            });
            this.dm.on("connected", () => {
                this.status = true;
                eve.emit("success", `${this.name}分区： 直播间 ${roomid} 连接成功`);
            });
            this.dm.connect();
            this.dm.on("data", data => {
                // console.log(data);
                switch (data.type) {
                    case 'NOTICE_MSG':
                        if(data.msg_self.indexOf("全区")<0 &&data.msg_self.indexOf("抽奖")>=0){
                            //单区广播礼物
                            eve.emit("dm_liveLottery",data)
                        }
                        break;
                    case "comment":
                        break;
                    case "SYS_MSG":
                        /* 绘马没有roomid参数，小电视+摩天大楼等绿色通知 */
                        if (data.roomid) {
                            if (data.msg.indexOf("摩天大楼")>=0) {
                                //仅提取摩天大楼
                                if(this.allow){
                                    eve.emit("dm_SmallTv", data);
                                }
                            }
                            //console.log(data);
                        }
                        break;
                    case "SYS_GIFT":

                        break;
                    case "online":
                        if(data.type!="online"||data.number<=10){
                            //number为0时即为下播
                            this.disconnect();
                            this.connect();
                            //当直播下线时自动切换到其他主播
                            eve.emit("info",`${this.name}分区： 检测到下播，自动切换其他房间 ...`);
                        }
                        //console.log(data);
                        break;
                    case "gift":
                        break;
                    case "ROOM_SILENT_OFF":
                        this.disconnect();
                        this.connect();
                        //当直播下线时自动切换到其他主播
                        eve.emit("info",`${this.name}分区： 检测到下播，自动切换其他房间 ...`);
                        break;
                    default:
                        break;
                }
            });
        }
        
        this._initConnect = true; //设置initConnect的值，用于监听器判断当前是正在工作中状态
    }
    disconnect() {
        this.status = false;
        if(typeof this.dm.disconnect =="function"){
            this.dm.disconnect();            
        }
        this.dm = {};
    }
    async getOnlineRoom(retry = 0) {
        let roomid ;
        try{
            let rq = await api.send("room/v1/area/getRoomList", {
                platform: "web",
                parent_area_id: this.type,
                sort_type: "online",
                page_size: "30",
            }, "get");
            let rooms =[];
            for(let r of rq.data){
                if(r.roomid==this.roomid){
                }else{
                    rooms.push(r);
                }
                 //取出非当前直播间的另一个直播间（热度更新有延迟）
            }
            if(rooms.length == 0){
                // fix 此处用于解决一个奇怪的undifined问题
                throw new Error("可用房间数量为 0 ");
            }else{
                rooms.sort((a, b) => { return b.online - a.online });
                roomid = rooms[ Math.floor((Math.random()/2*rooms.length))].roomid; //随机取一个房间
            }
        }
        catch(e){
            eve.emit("info",`${this.name} :获取直播房间：${e.message}`);
            if(retry>=5){
                roomid = 0;
            }else{
                eve.emit("info",`获取房间列表出错，第${retry+1}次尝试`);
                roomid = await this.getOnlineRoom(retry+1);
            }

        }
        finally{
            return roomid;
        }


        
    }
}
export default dm;