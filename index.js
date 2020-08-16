const puppeteer = require('puppeteer');
const CronJob = require('cron').CronJob;
const http = require('http');
const readline = require('readline');
const fs = require('fs');
const pathPrefix = 'content/';
const screenshotPathPrefix = 'screenshot/';
let CronString = Math.floor(Math.random() * 100) % 60 + ' ' + Math.floor(Math.random() * 100) % 60 + ' ' + Math.floor(Math.random() * 10) % 7 + ' * * *';
// const CronString = '0 * * * * *';
let server;

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
    if (page !== null) {
        await log('INFO', 'Screenshot before fail will be captured to: ' + pathPrefix + 'onError.png');
        await page.screenshot({path: pathPrefix + 'onError.png'});
    }
    throw reason;
    // process.exit(1);
}

async function emuBrowser(username, password) {
    await log('INFO', 'Starting puppeteer...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 450, height: 550 });

    await page.goto('https://www.shou.edu.cn/');
    await page.screenshot({
        path: pathPrefix + 'init.png'
    });

    await log('INFO', 'Logging in...');

    /* --- Login --- */
    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);
    await page.screenshot({path: pathPrefix + 'login.png'});
    await page.click('input[name="submit"]');

    try {
        await page.waitForSelector(".c_4f9dff");
        await log('INFO', 'Login succeeded.');
    }
    catch (e) {
        await onReject(e, "Login failed. Maybe there's a problem in credential or VPN connection?", page);
        await page.screenshot({
            path: pathPrefix + 'postlogin.png'
        });
    }

    await page.goto('https://workflow.shou.edu.cn/infoplus/form/XSJKSBLJ/start');
    await log('INFO', 'Redirecting...');

    try {
        await log('INFO', 'Waiting for report UI to show up...');
        await page.waitForSelector('#V0_CTRL62', {visible: true});
        await page.click("#V0_CTRL62");
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
        await log('INFO', "Wait until report process finished...");
        await page.waitFor(1000);
        await page.waitForSelector(".dialog_button");
    }
    catch (e) {
        await onReject(e, "Potentially failed report. Maybe performed between 22:00 - 23:59 ?", page);
    }

    await log('INFO', 'Report succeed.');
    await page.screenshot({path: pathPrefix  + 'success.png'});
    let screenshotPath = 'report-' + new Date().toISOString() + '.png'
    let screenshotString = await page.screenshot({path: pathPrefix + screenshotPathPrefix + screenshotPath, encoding: 'base64'});
    await log('INFO', 'Screenshot saved at: ' + pathPrefix + screenshotPathPrefix + screenshotPath);

    await browser.close();
    await log('INFO', 'Closing browser...');
    await log('INFO', 'Exiting...\n');
    return screenshotString;
    // process.exit(0);
}

async function screenshotServer(image, server) {
    try
    {
        if (server !== undefined) {
            server.shutdown(async function(err) {
                if (err) {
                    return onReject(err.message, 'Screenshot server failed on shutting down.', null);
                }
                await log('INFO', 'Shutting down screenshot server to reload new screenshot.');
            });
        }
        server = http.createServer(function (req, res) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write("<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <title>Auto Health Report</title>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div>\n" +
                "        <p>\n" +
                "            This screenshot is taken at: " + new Date().toString() +
                "    </p>\n" +
                "        <br/>\n" +
                "        <p>\n" +
                "            <img src=\"data:image/png;base64," + image + "\"/>        </p>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>"
            );
            res.end();
        });
        server = require('http-shutdown')(server);
        server.listen(8124);
        await log('INFO', 'Now you can go to http://localhost:8124/ to access screenshot.\n');
        return server;
    }
    catch (e) {
        await onReject(e, 'Screenshot server goes wrong.', null);
    }
}

async function task() {
    if (!fs.existsSync(pathPrefix)) {
        fs.mkdirSync(pathPrefix);
    }
    if (!fs.existsSync(pathPrefix + screenshotPathPrefix)) {
        fs.mkdirSync(pathPrefix + screenshotPathPrefix);
    }
    const config = await credInput();
    let image = await emuBrowser(config.username, config.password);
    server = await screenshotServer(image, server);
}

(async () => {
    let option = 'n';
    try {
        await log('INFO', 'Dry run...\n');
        await task();
        await log('INFO', 'Dry run completed.');
        option = 'y';
    }
    catch (e) {
        await log('WARN', 'Dry run failed.');
        await log('ERR', 'Reason: ' + e);
        await log('INFO', 'Continue anyway?');
        option = await (async () => {
            return new Promise(resolve => {
               rl.question('(y/N)', answer => {
                   resolve(answer || 'n');
               });
            });
        })();
    }

    if (option === 'y') {
        let job = new CronJob(CronString, async () => {
            await task();
            job.stop();
        }, () => {
            log('INFO', 'Scheduled run completed.');
            log('INFO', 'Next task will be fired at: ' + new Date(job.nextDate()).toLocaleString() + '\n');
            job.start();
        }, false, 'Asia/Shanghai');
        job.start();
        await log('INFO', 'Cronjob set. Cron string: ' + CronString);
        await log('INFO', 'Next task will be fired at: ' + new Date(job.nextDate()).toLocaleString() + '\n');
    }
    else {
        process.exit(1);
    }
})();


