module.exports = `
// ==UserScript==
// @name         GeeTest Hacker
// @namespace    mscststs
// @version      0.1
// @description  极验破解工具
// @author       mscststs
// @match        https://passport.bilibili.com/ajax/miniLogin/minilogin
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // 工具库
    var mscststs= new class{
    sleep(miliseconds){
      return new Promise(resolve=>{
        setTimeout(()=>{resolve();},miliseconds);
      });
    }
    async _Step(selector,callback,need_content,timeout){
      while(timeout--){
                if(document.querySelector(selector)===null){
            await this.sleep(100);
          continue;
                }else{
                    if(need_content){
                            if(document.querySelector(selector).innerText.length==0){
                              await this.sleep(100);
                continue;
                        }
                    }
                }
        break;
      }

      callback(selector);
    }
    wait(selector,need_content = false,timeout=Infinity){
      return new Promise(resolve=>{
        this._Step(selector,function(selector){resolve(document.querySelector(selector));},need_content,timeout);
      });
    }
  }();
    async function eventHijacker(cb){
        let hijackEventList  = ["mousedown","mousemove","mouseup","click","dblclick","pointerup","pointerdown","pointermove"];
        function handler(e){
            if(!e.fake){
                // 拦截真事件，防止触发
                e.stopPropagation();
                e.preventDefault();
                return false
            }
        }
        hijackEventList.forEach(eventKey=>{
            window.addEventListener(eventKey,handler,true)
        })
        await cb()
        hijackEventList.forEach(eventKey=>{
            window.removeEventListener(eventKey,handler,true)
        })
    }
    (async ()=>{
        // 初始化 ，监听canvas
        await mscststs.sleep(1000)
        document.querySelector("#login-submit").dispatchEvent(new Event("click"))
        await mscststs.wait(".geetest_slider_tip")
        await mscststs.sleep(500)
        // 重放开始
        eventHijacker(async ()=>{
            await replay(getTargetRecorder(fetchCanvas()-9,1000),".geetest_slider_button")
        })

    })()

    // 亲自录制的老奶奶轨迹，成功率 100%
    const recoder = [{"type":"pointerdown","clientX":256,"clientY":709,"ts":2176},{"type":"pointermove","clientX":256,"clientY":709,"ts":2190},{"type":"pointermove","clientX":256,"clientY":707,"ts":2239},{"type":"pointermove","clientX":257,"clientY":707,"ts":2247},{"type":"pointermove","clientX":258,"clientY":707,"ts":2254},{"type":"pointermove","clientX":259,"clientY":707,"ts":2263},{"type":"pointermove","clientX":259,"clientY":708,"ts":2279},{"type":"pointermove","clientX":260,"clientY":708,"ts":2287},{"type":"pointermove","clientX":261,"clientY":708,"ts":2296},{"type":"pointermove","clientX":263,"clientY":708,"ts":2303},{"type":"pointermove","clientX":265,"clientY":708,"ts":2312},{"type":"pointermove","clientX":268,"clientY":708,"ts":2319},{"type":"pointermove","clientX":271,"clientY":709,"ts":2328},{"type":"pointermove","clientX":277,"clientY":709,"ts":2335},{"type":"pointermove","clientX":280,"clientY":710,"ts":2346},{"type":"pointermove","clientX":284,"clientY":710,"ts":2351},{"type":"pointermove","clientX":289,"clientY":711,"ts":2362},{"type":"pointermove","clientX":294,"clientY":711,"ts":2367},{"type":"pointermove","clientX":299,"clientY":713,"ts":2379},{"type":"pointermove","clientX":303,"clientY":713,"ts":2386},{"type":"pointermove","clientX":306,"clientY":713,"ts":2396},{"type":"pointermove","clientX":309,"clientY":713,"ts":2399},{"type":"pointermove","clientX":311,"clientY":713,"ts":2407},{"type":"pointermove","clientX":315,"clientY":713,"ts":2415},{"type":"pointermove","clientX":318,"clientY":713,"ts":2422},{"type":"pointermove","clientX":322,"clientY":713,"ts":2431},{"type":"pointermove","clientX":326,"clientY":713,"ts":2439},{"type":"pointermove","clientX":330,"clientY":713,"ts":2447},{"type":"pointermove","clientX":333,"clientY":713,"ts":2455},{"type":"pointermove","clientX":336,"clientY":713,"ts":2463},{"type":"pointermove","clientX":338,"clientY":714,"ts":2471},{"type":"pointermove","clientX":339,"clientY":714,"ts":2481},{"type":"pointermove","clientX":338,"clientY":714,"ts":2719},{"type":"pointermove","clientX":337,"clientY":716,"ts":2732},{"type":"pointermove","clientX":336,"clientY":716,"ts":2735},{"type":"pointermove","clientX":334,"clientY":716,"ts":2746},{"type":"pointermove","clientX":333,"clientY":716,"ts":2751},{"type":"pointermove","clientX":332,"clientY":716,"ts":2762},{"type":"pointermove","clientX":330,"clientY":716,"ts":2767},{"type":"pointermove","clientX":329,"clientY":716,"ts":2779},{"type":"pointermove","clientX":328,"clientY":716,"ts":2783},{"type":"pointermove","clientX":327,"clientY":716,"ts":2799},{"type":"pointermove","clientX":328,"clientY":716,"ts":3063},{"type":"pointermove","clientX":329,"clientY":716,"ts":3087},{"type":"pointermove","clientX":330,"clientY":716,"ts":3103},{"type":"pointermove","clientX":331,"clientY":716,"ts":3127},{"type":"pointermove","clientX":332,"clientY":716,"ts":3146},{"type":"pointermove","clientX":331,"clientY":716,"ts":3583},{"type":"pointermove","clientX":330,"clientY":716,"ts":3639},{"type":"pointermove","clientX":329,"clientY":716,"ts":3655},{"type":"pointerup","clientX":329,"clientY":716,"ts":4407},{"type":"click","clientX":329,"clientY":716,"ts":4420},{"type":"pointermove","clientX":329,"clientY":716,"ts":4422},{"type":"mousemove","clientX":329,"clientY":716,"ts":4422}]
    /**
    * ImageData 转色值矩阵
    */
    function imageDataToBrightnessArray(imageData,width,height){
        let brightnessArray = []
        let pixel_color = imageData
        let pointer = 0
        for(let i=0;i< height;i++)
        {
            brightnessArray[i] = []; //将每一个子元素又定义为数组
            for( let n=0;n< width;n++)
            {
                brightnessArray[i][n]= parseInt((pixel_color[pointer] + pixel_color[pointer+1] + pixel_color[pointer+2]) / 3) ; //此时pix[i][n]可以看作是一个二级数组
                pointer = pointer+4;
            }
        }
        return brightnessArray

    }
    function zipArray_row(b_array){
        let result = []
        let height = b_array.length;
        let width = b_array[0].length;
        for(let i = 0;i<width;i++){
            let val = 0;
            for(let j= 0;j<height ; j++){
                val += b_array[j][i]
            }
            result[i] = parseInt(val/height)
        }
        return result
    }
    function drawVline(ctx,left){
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(left, 0, 1, ctx.height)
    }
    function getctx(selector){
        let bgCanvas = document.querySelector(selector);
        let {width, height} = bgCanvas; // 宽度，高度
        let ctx = bgCanvas.getContext("2d");
        ctx.height = height;
        ctx.width = width;
        return ctx
    }
    function getImageData(selector){
        let ctx = getctx(selector)
        return ctx.getImageData(0,0,ctx.width,ctx.height).data
    }
    window.fetchCanvas = function(brightStep=10){
        let fullBgData = getImageData(".geetest_canvas_fullbg") // 完整背景图
        let bgData = getImageData(".geetest_canvas_bg") // 残缺背景图
        let bgctx = getctx(".geetest_canvas_bg")
        window.brightnessArray = imageDataToBrightnessArray(bgData.map((item,index)=>{
            return item^fullBgData[index]
        }),bgctx.width,bgctx.height)

        window.brightnessArray_row = zipArray_row(window.brightnessArray)
        let leftOffset = 0;
        window.brightnessArray_row.find((item,index)=>{
            function testNextPix(array,index,step){
                let flag = 1;
                for(let i = index; i < Math.min(array.length,index+10); i++ ){
                    if(array[i] <step ){
                        flag = 0;
                    }
                }
                return flag
            }
            if(testNextPix(window.brightnessArray_row ,index,brightStep)){
                leftOffset = index
                drawVline(bgctx ,index)
                return true
            }
        })
        // 拿到 leftOffset ，就是对应的缺口的偏移量
        console.log(leftOffset)
        return leftOffset
    }
    // 录制鼠标事件
    window.record = async function(){
        return await new Promise((resolve,reject)=>{
            let ms = new Date().valueOf();
            const getTime = ()=>{ // 时间打点
                return new Date().valueOf() - ms;
            }
            let eventList = [];
            function eventRecorder(e){
                let { type, clientX, clientY, target } = e;
                let eventMsg = { type, clientX, clientY, ts:getTime()}
                eventList.push(eventMsg)
            }
            // 开始录制
            window.addEventListener("keyup",(e)=>{
                ["mousedown","mousemove","mouseup","click","dblclick","pointerup","pointerdown","pointermove"].forEach(eventKey=>{
                    window.addEventListener(eventKey,eventRecorder,true)
                })
                // 停止录制
                window.addEventListener("keyup",(e)=>{
                    ["mousedown","mousemove","mouseup","click","dblclick","pointerup","pointerdown","pointermove"].forEach(eventKey=>{
                        window.removeEventListener(eventKey,eventRecorder,true)
                    })
                    resolve(eventList)
                },{once:true})
            },{once:true})
        })
    }
    // 轨迹压缩和重整
    window.getTargetRecorder = function getTargetRecorder(targetlength=100, targetduration=1000, recorder=recoder, ){
        // step 1. 首先以第一个事件的位置为起始，压缩整个轨迹
        let base = recorder[0];
        let ziped_recorder = recorder.map(event=>{
            return {
                type:event.type,
                offsetX:event.clientX - base.clientX,
                offsetY:event.clientY - base.clientY,
                ts:event.ts - base.ts
            }
        })
        // 压缩后的事件记录
        // console.log("ziped", ziped_recorder)
        let max = ziped_recorder[ziped_recorder.length -1] // 拿到最后一个
        ziped_recorder.reduce((p,e,i)=>{
            e.offsetX = parseInt(e.offsetX * targetlength / max.offsetX) // 轨迹缩放
            e.ts = parseInt(e.ts * targetduration / max.ts ) // 时间戳缩放
            return e
        })
        return ziped_recorder
    }
    // 轨迹事件重放
    window.replay = function(recorder, dom){
        if(typeof dom === "string"){
            dom = document.querySelector(dom)
        }
        let {left, top} = document.querySelector(".geetest_slider_button").getBoundingClientRect();
        left = left + 20* Math.random()
        top = top + 20* Math.random()
        return Promise.all(
            recorder.map(e=>{
                return new Promise(resolve=>{

                    setTimeout(()=>{
                        let event = new Event(e.type,{"bubbles":true, "cancelable":false});
                        event.offsetX = e.offsetX;
                        event.offsetY = e.offsetY;
                        event.screenX = event.pageX = event.clientX = e.offsetX + left;
                        event.screenY = event.pageY = event.clientY = e.offsetY + top;
                        event.fake = true;
                        dom.dispatchEvent(event);
                        resolve()
                        //console.log("....",e.type,event)
                    },e.ts)
                })
            })
        )
    }
})();
`
