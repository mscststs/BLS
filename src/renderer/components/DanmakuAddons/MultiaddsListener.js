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
        eve.on("HeartBeat",()=>{
            if(this.status){
                this.CheckInType();
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
            eve.emit("info",this.name + "分区检测 ：房间分区正常");
        }
    }
    async connect() {
        if (Object.keys(this.dm).length && this.dm._socket) {
            /* 防止多个socket并存 */
            this.disconnect();
        }

        let roomid = await this.getOnlineRoom();
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
            switch (data.type) {
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
    disconnect() {
        this.status = false;
        this.dm.disconnect();
        this.dm = {};
    }
    async getOnlineRoom() {
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
        }
        //取出非当前直播间的另一个直播间（热度更新有延迟）

        rooms.sort((a, b) => { return b.online - a.online });
        return rooms[0].roomid; //返回人气最高的房间ID
    }
}
export default dm;