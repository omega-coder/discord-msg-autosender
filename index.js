const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require("fs");
const inquirer = require("inquirer");
const chalk = require("chalk");
const error = chalk.bold.red;
const warning = chalk.bold.keyword('orange');

const log = console.log;

const {
    discord_password,
    discord_user,
    server_name
} = require('./config');

const port = 1337;
const DISCORD_APP_URL = "https://discordapp.com/app";


(async () => {
    const response = await axios.get(`http://localhost:${port}/json/version`);

    if (response.status !== 200) {
        log(error(`[!] CHECK IF YOUR CHROME/CHROMIUM IS REALLY LISTENING ON PORT ${port}`));
    } else {
        log(chalk.bold.green(`[+] Got Response from http://localhost:${port}/json/version`));
    }

    const {
        webSocketDebuggerUrl
    } = response.data;
    log(chalk.blue(`[?] Got webSocketDebuggerUrl: ${webSocketDebuggerUrl}`));

    const browser = await puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl,
        defaultViewport: null
    });
    log(chalk.bold.green(`[+] Connected to chrome instance`));
    const page = await browser.newPage();
    await page.setViewport({
        width: 1300,
        height: 1100
    });
    await page.goto(DISCORD_APP_URL);

    if (page.url() === "https://discordapp.com/login") {
        log(chalk.blue(`[INFO] Got redirect to https://discordapp.com/login`));
        log(chalk.bold.blue(`[+] Attempting login with given credentials`));
        await page.waitForSelector('[type="email"]');
        await page.evaluate(() => document.querySelector('[type="email"]').value = "");
        await page.focus('[type="email"]');
        await page.keyboard.type(discord_user.toString(), {
            delay: 100
        });
        await page.waitForSelector('[type="password"]');
        await page.evaluate(() => document.querySelector('[type="password"]').value = "");
        await page.focus('[type="password"]')
        await page.keyboard.type(discord_password.toString(), {
            delay: 100
        });

        await page.keyboard.press('Enter');
        if (page.url() === "https://discordapp.com/activity") {
            log(chalk.bold.green(`[+] Login Successfull!`));
        } else {
            log(error(`[!] Login failed, Exiting now...!`));
            process.exit(1);
        }
    }

    await page.waitForSelector(`a[aria-label="${server_name}"]`);
    await page.evaluate(({
        server_name
    }) => document.querySelector(`a[aria-label="${server_name}"]`).click(), {
        server_name
    });
    await autoScroll(page);

    await page.waitFor(() => document.querySelectorAll('.containerDefault-1ZnADq').length);

    const channels__ = await page.evaluate(() => {
        let channels = document.querySelectorAll('.containerDefault-1ZnADq .name-3_Dsmg');
        let chans = Array();
        for (let i = 0; i < channels.length; i++) {
            if (!channels[i].previousSibling.hasAttribute('name')) {
                chans.push(channels[i].innerHTML);
            }
        }
        return chans;
    });

    await page.setViewport({
        width: 1300,
        height: 768
    });

    let flood__channel_ = "";

    await inquirer
        .prompt([{
            type: 'checkbox',
            name: 'channel',
            message: 'Which channel you want to flood? (only first choice will be considerated)',
            choices: channels__,
            default: "general",
        }, ])
        .then(answers => {
            flood__channel_ = answers.channel[0];
        });

    log(chalk.bold.white('[+] Selected channel: ' + chalk.bold.red(`${flood__channel_}`)));

    await page.evaluate(({
        flood__channel_
    }) => {
        let channels = document.querySelectorAll('.containerDefault-1ZnADq .name-3_Dsmg');
        for (let i = 0; i < channels.length; i++) {
            if (channels[i].innerHTML == flood__channel_) {
                channels[i].click();
            }
        }
    }, {
        flood__channel_
    });


    await page.waitForSelector('textarea');
    await page.focus('textarea');

    log(warning(`[+] Starting channel flood.`));

    try {
        // read contents of the file
        const data = fs.readFileSync('mr_robot.txt', 'UTF-8');
        const lines = data.split(/\r?\n/);
        let n_lines = 1;
        for (let l_indx = 0; l_indx < lines.length; l_indx++) {
            await page.keyboard.type(lines[l_indx], {
                delay: 50
            });
            await page.keyboard.press('Enter');
            log(`[+] Sent ${n_lines} messages to channel ${flood__channel_}`);
            n_lines++;
        }
    } catch (err) {
        log(error(err.toString()));
    }

})();

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 1000;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}