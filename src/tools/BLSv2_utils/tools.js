import { remote } from 'electron'
import autoSlideScript from './script/autoSlide' // 自动滑动登录

/**
 * @description 以用户名和密码登录
 * @param {string} username
 * @param {string} password
 */
export async function userLogin (username = '', password = '') {
  // Step 1 打开浏览器页面
  let currentWindow = remote.getCurrentWindow()
  let child = new remote.BrowserWindow({
    title: 'bilibili 快速登录',
    parent: currentWindow,
    webPreferences: {
      devTools: false
    },
    darkTheme: true
  })
  child.show()
  // JS 在处理双层事件循环和跨作用域操作时，简直反人类，只能通过这种写法来解决
  return Promise.race([
    // 函数 1 ，正常流程，完成登录和返回Cookies
    (async () => {
      child.loadURL('https://account.bilibili.com/ajax/miniLogin/minilogin') // B 站登录地址
      // Step 2 填写用户名密码(如果有的话)
      let childWebContents = child.webContents
      childWebContents.on('new-window', function (event) {
        event.preventDefault() // 阻止打开新窗口
      })
      await new Promise((resolve, reject) => {
        childWebContents.once('did-finish-load', () => {
          resolve()
        })
      })
      childWebContents.executeJavaScript(`
        document.querySelector("#login-username").value = "${username}";
        document.querySelector("#login-passwd").value = "${password}";
        ${autoSlideScript}
      `)
      // 等待重定向 -- 可能密码
      let cookies = await new Promise((resolve, reject) => {
        childWebContents.once('will-navigate', (event, url) => {
          if (~url.indexOf('https://passport.biligame.com/crossDomain')) {
            // Step 3 从 url 解析出 cookies
            let { searchParams } = new URL(url)
            let expires = searchParams.get('Expires')
            let cookies = ['DedeUserID', 'DedeUserID__ckMd5', 'SESSDATA', 'bili_jct'].map(key => {
              return {
                name: key,
                value: searchParams.get(key),
                expires: expires
              }
            })
            resolve(cookies)
          }
        })
      })
      child.close()
      return cookies
    })(),
    // 函数 2 , 意外流程，检查到窗口关闭时，直接返回
    new Promise((resolve, reject) => {
      child.on('close', (event) => {
        reject(new Error('login refused'))
      })
    })
  ])
}
