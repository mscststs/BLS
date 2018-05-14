'use strict';

const fs = require('fs');
const os = require('os');
const { join, sep } = require('path');

const Puppeteer = require('puppeteer');

// const log = global.log || new Log(process.env.LOG_LEVEL || 'info');
let log ={};
log.info = log.warning = log.debug = log.verbose =  console.log;

const headless = process.env.HEADLESS_DEBUG !== 'true';

async function getTokens(u, p) {
    log.debug('Launching browser...');
    const browser = await Puppeteer.launch({
        args: ['--no-sandbox'],
        headless
    });
    const page = await browser.newPage();
    try {
        log.debug('Going to QZone login page...');
        await page.goto('https://m.qzone.com', { waitUntil: 'domcontentloaded' });
        log.debug('Typing username and password...');
        await page.type('#u', `${u}`, { delay: 120 });
        await page.type('#p', `${p}`, { delay: 120 });
        log.debug('Clicking Login...');
        await page.click('#go');
        log.debug('Waiting for redirection...');
        await page.waitFor('#container');
        log.debug('Going to WebQQ login page...');
        await page.goto('https://web2.qq.com', { waitUntil: 'networkidle2' });
        log.debug('Waiting for avatar...');
        await page.waitFor('iframe[name=ptlogin]');
        const ptLoginFrame = page.frames().find(f => f.name() === 'ptlogin');
        const ptLoginURL = ptLoginFrame.url();
        log.debug(ptLoginURL);
        if (ptLoginURL.startsWith('https://xui.ptlogin2.qq.com/cgi-bin/xlogin')) {
            ptLoginFrame.waitFor('#qlogin_list a.face');
            log.debug('Clicking avatar...');
            const avatar = await ptLoginFrame.$('#qlogin_list a.face');
            await avatar.click();
        } else if (ptLoginURL.startsWith('https://w.qq.com/proxy.html')) {
            log.debug('Nothing. Just wait for auto-login...');
        }
        log.debug('Waiting for redirection...');
        await page.waitFor('#main_container');
        log.debug('Waiting for contacts to be loaded...');
        await page.waitFor('li[id*=recent-item].list_item');
        log.debug('Getting tokens...');
        const vfwebqq = await page.evaluate('mq.vfwebqq');
        const ptwebqq = await page.evaluate('mq.ptwebqq');
        const psessionid = await page.evaluate('mq.psessionid');
        const cookies = await page.cookies('https://w.qq.com', 'https://web2.qq.com');
        log.debug(`Cookie count: ${cookies.length}`);
        const uin = cookies.find(ck => ck.name === 'uin').value;
        const cookieStr = cookies.reduce((str, ck) => `${str}${ck.name}=${ck.value}; `, '');
        if (headless) await browser.close();
        const tokens = {
            uin,
            vfwebqq,
            ptwebqq,
            psessionid,
            cookieStr
        };
        log.debug(tokens);
        return tokens;
    } catch (error) {
        log.error('Login with puppeteer:\n', error);
        const dir = fs.mkdtempSync(os.tmpdir() + sep + 'qq-bot-rebown-');
        const path = join(dir, `${Date.now()}.png`);
        await page.screenshot({ path, fullPage: true });
        log.error('Screenshot saved to', path);
        process.exit(1);
    }
}

export default {
    getTokens
};
