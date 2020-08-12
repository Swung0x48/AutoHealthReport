const puppeteer = require('puppeteer');
const cron = require('cron');
const readline = require('readline');
const fs = require('fs');
const pathPrefix = 'content/';
const screenshotPathPrefix = 'screenshot/';

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
    return new Promise(resolve => {
        console.log('[' + level + '] ' + detail);
        resolve();
    });
}

async function onReject(reason, detail, page) {
    await log('ERR', detail);
    await log('ERR', 'Reason: ' + reason);
    await log('INFO', 'Screenshot before fail will be captured to: ' + pathPrefix + 'onError.png');
    await page.screenshot({path: pathPrefix + 'onError.png'});
    process.exit(1);
}

async function emuBrowser(cred) {
    await log('INFO', 'Starting puppeteer...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // await page.setViewport({ width: 750, height: 1334 });

    await page.goto('https://www.shou.edu.cn/');
    await page.screenshot({
        path: pathPrefix + 'init.png'
    });

    await log('INFO', 'Logging in...');

    /* --- Login --- */
    await page.type('input[name="username"]', cred.username);
    await page.type('input[name="password"]', cred.password);
    await page.screenshot({path: pathPrefix + 'login.png'});
    await page.click('input[name="submit"]');

    try {
        await page.waitForSelector(".c_4f9dff");
        await log('INFO', 'Login succeeded.');
    }
    catch (e) {
        await onReject(e, 'Login failed', page);
        await page.screenshot({
            path: pathPrefix + 'postlogin.png'
        });
    }

    await page.goto('https://workflow.shou.edu.cn/infoplus/form/XSJKSBLJ/start');
    await log('INFO', 'Redirecting...');

    try {
        await log('INFO', 'Waiting for report UI to show up...');
        await page.waitForSelector('#V1_CTRL82', {visible: true});
        await page.click("#V1_CTRL82");
        await page.screenshot({path: pathPrefix + 'pre-report.png'});
        await log('INFO', 'Report UI OK.');
    }
    catch (e) {
        await onReject(e, 'Report UI does not show up.', page);
    }

    await page.waitForSelector(".command_button_content");
    await page.click(".command_button_content");

    await page.waitForSelector(".dialog_button.default.fr");
    await page.click(".dialog_button.default.fr");
    try {
        await log('INFO', "Wait until success...");
        await page.waitFor(1000);
        await page.waitForSelector(".dialog_button");
    }
    catch (e) {
        await onReject(e, "Potentially failed report. Maybe performed between 22:00 - 23:59 ?", page);
    }

    await log('INFO', 'Report succeed.');
    let screenshotPath = 'report-' + new Date().toISOString() + '.png'
    await page.screenshot({path: pathPrefix + screenshotPathPrefix + screenshotPath});
    await log('INFO', 'Screenshot saved at: ' + pathPrefix + screenshotPathPrefix + screenshotPath);

    await browser.close();
    await log('INFO', 'Closing browser...');
    await log('INFO', 'Exiting...');
    process.exit(0);
}

(async () => {
    if (!fs.existsSync(pathPrefix)) {
        fs.mkdirSync(pathPrefix);
    }
    if (!fs.existsSync(pathPrefix + screenshotPathPrefix)) {
        fs.mkdirSync(pathPrefix + screenshotPathPrefix);
    }
    const cred = await credInput();
    await emuBrowser(cred);
})();
