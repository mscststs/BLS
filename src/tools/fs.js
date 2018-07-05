import fs from "fs"

function exists(path){
    return new Promise(resolve=>{
        fs.exists(path,status=>{
            resolve(status);
        });
    });
    // async 判断文件是否存在
}
function WriteString(path,string){
    return new Promise((resolve,reject)=>{
        fs.open(path, 'w', (err, fd) => {
            if (err) {
              reject(err);
            }
          
            fs.writeFile(fd,string,(err)=>{
                if(err){
                    reject(err);
                }else{
                    resolve();
                }
            });
          });
    });
    // 同步写入文件
}
export default {exists,WriteString}