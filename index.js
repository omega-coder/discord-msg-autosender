const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require("fs");
const inquirer = require("inquirer");

const {
    discord_password,
    discord_user,
    discord_channel_url
} = require('./config');

const port = 1337;
const DISCORD_APP_URL = "https://discordapp.com/app";


(async () => {
    const response = await axios.get(`http://localhost:${port}/json/version`);

    const {
        webSocketDebuggerUrl
    } = response.data;

    const browser = await puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl,
        defaultViewport: null
    });


    const page = await browser.newPage();
    await page.setViewport({
        width: 1200,
        height: 1000
    });
    await page.goto(DISCORD_APP_URL);

    if (page.url() === "https://discordapp.com/login") {
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
    }

    await page.waitForSelector('a[aria-label="ShellmatesTeam2020"]');
    await page.evaluate(() => document.querySelector('a[aria-label="ShellmatesTeam2020"]').click());

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

    console.log(flood__channel_);

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

    try {
        // read contents of the file
        const data = fs.readFileSync('mr_robot.txt', 'UTF-8');
        const lines = data.split(/\r?\n/);

        for (let l_indx = 0; l_indx < lines.length; l_indx++) {
            await page.keyboard.type(lines[l_indx], {
                delay: 50
            });
            await page.keyboard.press('Enter');
        }
    } catch (err) {
        console.error(err);
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