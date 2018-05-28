import DmService from "~/tools/danmaku";
import api from "~/tools/api";
import eve from  "~/tools/events"

class dm {
    constructor(type) {
        this.type = type;
        this.status = false;
        this.roomid = 0;
        this.dm = {};
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
            eve.emit("success", `直播间 ${roomid} 连接成功`);
        });
        this.dm.connect();
        this.dm.on("data", data => {
            switch (data.type) {
                case "comment":
                    //eve.emit("dm_chat", data);
                    break;
                case "SYS_MSG":
                    /* 绘马没有roomid参数，小电视+摩天大楼等绿色通知 */
                    if (data.roomid) {
                        if (data.msg.indexOf("摩天大楼")>=0) {
                            //仅提取摩天大楼
                            eve.emit("dm_SmallTv", data);
                        }
                        //console.log(data);
                    }
                    break;
                case "SYS_GIFT":
                    /* if (data.roomid) {
                        
                        eve.emit("dm_raffle", data);
                    } */
                    break;
                case "online":
                    //eve.emit("dm_online", data);
                    if(data.type!="online"){
                        this.disconnect();
                        this.connect();
                        //当直播下线时自动切换到其他主播
                        eve.emit("info","检测到下播，自动切换其他房间 ...");
                    }
                    //console.log(data);
                    break;
                case "gift":
                    break;
                default:
                    break;
            }
        });

    }
    disconnect() {
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
        let rooms = rq.data;

        rooms.sort((a, b) => { return b.online - a.online });
        return rooms[0].roomid; //返回人气最高的房间ID
    }
}
export default dm;