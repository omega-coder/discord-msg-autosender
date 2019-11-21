const chromeLauncher = require('chrome-launcher');
const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require("fs");

const {
    discord_password,
    discord_user,
    discord_channel_url
} = require('./config');


(async () => {
    const chrome = await chromeLauncher.launch({
        chromeFlags: ['--disable-gpu', '--window-size=1360,700']
    });
    const response = await axios.get(`http://localhost:${chrome.port}/json/version`);
    const {
        webSocketDebuggerUrl
    } = response.data;

    const browser = await puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl
    });
    const page = await browser.newPage();
    await page.goto(discord_channel_url.toString());
    await page.waitForSelector('[type="email"]');

    await page.focus('[type="email"]');
    await page.keyboard.type(discord_user.toString(), {
        delay: 100
    });
    await page.waitForSelector('[type="password"]');
    await page.focus('[type="password"]')
    await page.keyboard.type(discord_password.toString(), {
        delay: 100
    });

    await page.keyboard.press('Enter');
    await page.waitForSelector('textarea');
    await page.focus('textarea');

    let quotes = JSON.parse(fs.readFileSync('quotes.json', 'utf8'));
    for (let i = 0; i < quotes.length; i++) {
        try {
            if (quotes[i].quote !== undefined && quotes[i].quote !== undefined) {
                await page.keyboard.type(quotes[i].quote + " " + `*${quotes[i].cite}*`, {
                    delay: 50
                });
                await page.keyboard.press('Enter');
            }
        } catch (error) {
            continue
        }
    }

})();