import http from "http"
import eve from "~/tools/events"

class myserver{
    constructor(getCallback){
        this.getRawHTML = getCallback;
        this.server = null;
    }
    getResponse(){
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <link rel="stylesheet" href="https://unpkg.com/element-ui/lib/theme-chalk/index.css">
                    <title>BLS-统计中心</title>
                </head>
                <body>
                    ${this.getRawHTML()}
                </body>
            </html>
        `;
    }
    async Open(port){
        try{
            this.server = http.createServer((req,res)=>{
                console.log(req);
                res.writeHead(200,{"Content-type":"text/html"});
                res.write(this.getResponse());
                res.end();
            });
            this.server.listen(port);
            return true;
        }catch(e){
            eve.emit("error",`创建HTTP服务时出错：${e.message}`);
            return false;
        }
    }
    close(){
        this.server.close();
    }
}

export default myserver;