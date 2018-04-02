/*
		以事件监听方式进行 部署，所有功能均需运行在eve接口之上。
		eve接口暴露了三个方法，使用on方法可以绑定一个事件和回调函数，index参数用于确认回调函数的优先级，index越大，越优先，相同的以先绑定的优先
		使用off方法可以解绑一个事件，如果绑定时使用了index，则解绑时也需要使用index，否则无法匹配
		使用emit可以触发一个事件，在回调函数中返回false将会阻止 index 较小的参数的继续回调

		例如：回调函数a和b同时绑定了“foo”，事件，a index为10，b index 为11，若b返回false，则 a 不会被回调

		本脚本内部所有的index值保持在 [-100,100]

	*/

export default new class{
    constructor(){
        this.handles={};
    }
    on(event,callback,index=0){
        if(!this.handles[event]){
            this.handles[event]=[];
        }
        this.handles[event].push({callback:callback,index:index});
        this.handles[event].sort((a,b)=>{return b.index-a.index});
    }
    emit(event,...data){
        if(this.handles[event]){
            for(let i of this.handles[event]){
                if(i.callback(...data)===false) break;
            }
        }
    }
    off(event,callback,index=0){
        if(this.handles[event]){
            let s = [];
            for(let i of this.handles[event]){
                if(i.callback!=callback && i.index != index){s.push(i)};
            }
            this.handles[event] = s;
        }
    }
}();