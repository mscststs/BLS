/* 使用一个window.localStorage["bls-config"]进行初始化和数据保存 */
import events from "~/tools/events"

class store{
    constructor(storeObj,storeID){
        this.users = [];
        if(storeObj[storeID]){
            this.data = JSON.parse(storeObj[storeID]);
        }else{
            storeObj[storeID] = "";
            this.data = {};
        }
        this.store = {storeObj:storeObj,storeID:storeID};
    }
    update(cb){
        /* 使用callback进行修改 */
        if(typeof(cb)==="function"){
            cb(this.data);
        }else if(typeof(cb)==="object"){// 传递新的对象,用深拷贝解除引用
            this.data = JSON.parse(JSON.stringify(cb));
        }else if(typeof(cb)==="string"){
            this.data = JSON.parse(cb);
        }else{
            return false;
        }
        this.save();
        events.emit("storeUpdated");
        return true;
    }
    toString(){
        return JSON.stringify(this.data);
    }
    save(){
        this.store.storeObj[this.store.storeID] = JSON.stringify(this.data);
    }
}


export default store;