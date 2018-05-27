import DmService from "~/tools/danmaku";
import api from "~/tools/api";

class dm{
    constructor(type){
        this.type =type; 
    }
    async getOnlineRoom(){
        let rq = await api.send("room/v1/area/getRoomList",{
            platform:"web",
            parent_area_id:this.type,
            sort_type:"online",
            page_size:"30",
        },"get");
        console.log(rq);
    }
}
export default dm;