const puppeteer = require('puppeteer');
// const http = require('http');
const readline = require('readline');
const fs = require('fs');
const pathPrefix = 'content/'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function credInput() {
    return new Promise((resolve, reject) => {
        let credentials = {};
        log('INFO', 'Check if account credentials exists...')
        if (fs.existsSync(pathPrefix + 'config.json')) {
            let rawStr = fs.readFileSync(pathPrefix + 'config.json', 'utf8');
            credentials = JSON.parse(rawStr);
            resolve(credentials);
        } else {
            log('WARN', 'Account credentials not found. User input required.')
            rl.question("Username(Student No.): ", e => {
                credentials.username = e;
                rl.question("Password: ", el => {
                    credentials.password = el;
                    fs.writeFileSync(pathPrefix + 'config.json', JSON.stringify(credentials), {encoding: 'utf8'});
                    rl.close();
                    resolve(credentials);
                })
            });
        }
    });
}

async function captchaInput() {
    return new Promise(resolve => {
        rl.question("Captcha:", e => {
            resolve(e);
        })
    })
}

async function ProcessCookie() {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(pathPrefix + 'cookie.json')) {
            let rawStr = fs.readFileSync(pathPrefix + 'cookie.json', "utf8");
            let cookie = JSON.parse(rawStr);
            resolve(cookie);
        } else {
            reject("No cookie found.");
        }
    })
}

async function log(level, detail) {
    console.log('[' + level + '] ' + detail);
}

async function emuBrowser(cred) {
    await log('INFO', 'Starting puppeteer...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // await page.setViewport({ width: 750, height: 1334 });

    // await log('INFO', 'Fetching cookie from file...');
    // ProcessCookie().then(value => {
    //     log('INFO', 'Set cookie from file...');
    //     page.setCookie(...value);
    // }, reason => {
    //     log('WARN', reason);
    // });
    await page.goto('https://www.shou.edu.cn/');
    await page.screenshot({
        path: pathPrefix + 'init.png'
    });

    // await log('INFO', 'Dry run: Test if cookies has expired...');
    // let url = await page.url();
    // if (url === "https://workflow.shou.edu.cn/taskcenter/workflow/index")
    // {
    //     await log('INFO', 'Cookie OK.');
    // }
    await log('INFO', 'Logging in...');

    /* --- Login --- */
    await page.type('input[name="username"]', cred.username);
    await page.type('input[name="password"]', cred.password);
    await page.click('input[name="submit"]');

    await page.screenshot({path: pathPrefix + 'login.png'});

    await page.waitForNavigation({
        waitUntil: 'networkidle0',
    });
    await page.screenshot({
        path: pathPrefix + 'post-login.png'
    });

    // const element = await page.$("img");
    // const captcha = await element.screenshot({
    //     path: pathPrefix + "captcha.png"
    // });
    // http.createServer(function (req, res) {
    //     res.writeHead(200, {'Content-Type': 'image/jpeg'})
    //     res.end(captcha) // Send the file data to the browser.
    // }).listen(8124)
    // console.log('Go to http://localhost:8124/ for captcha.');
    // let captchaVal = await captchaInput();
    // await page.type('#imageCodeName', captchaVal);
    // await page.click("input[value='提交']");


    /* --- Login Complete --- */
    //
    // /* --- Save Cookie --- */
    // let cookies = await page.cookies()
    // console.log(cookies);
    // fs.writeFileSync(pathPrefix + 'cookie.json', JSON.stringify(cookies));
    // /* --- Save Cookie Complete --- */


    await page.goto('https://workflow.shou.edu.cn/infoplus/form/XSJKSBLJ/start');
    await page.waitForNavigation({
        waitUntil: 'networkidle0',
    });

    // let tmp = await page.url();
    // console.log(tmp);
    await page.screenshot({path: pathPrefix + 'pre-report.png'});

    cookies = await page.cookies()
    console.log(cookies);

    // await page.click("#V1_CTRL82");
    // await page.click("#infoplus_action_4789_1");

    await browser.close();
    process.exit(0);
}

(async () => {
    if (!fs.existsSync(pathPrefix)) {
        fs.mkdirSync(pathPrefix);
    }
    const cred = await credInput();
    await emuBrowser(cred);
})();
