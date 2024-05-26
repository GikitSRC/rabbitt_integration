const { chromium } = require('playwright');

async function journal() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `journal-bar-${year}-${month}-${day}`;
}

async function loginAndNavigate(page) {
    await page.goto("https://hole.rabbit.tech");
    await page.type('input[name="username"]', 'RABBITHOLE_EMAIL');
    await page.type('input[name="password"]', 'RABBITHOLE_EMAIL');
    await page.keyboard.press("Enter");
    await page.click(`#${await journal()}`);
}

async function checkJournal(page) {
    await page.click('div.mb-8 ul li:first-child');
    return await page.textContent("div.whitespace-pre-wrap");
}

let loggedIn = false;

async function discordLogin(page, name, message) {
    if (!loggedIn) {
        await page.goto("https://discord.com/login");
        await page.fill('input[name="email"]', 'DISCORD_PHONENUMBER/EMAIL');
        await page.fill('input[name="password"]', 'DISCORD_PASSWODR');
        await page.keyboard.press("Enter");
        sendMessage(page, name, message);
        console.log("Message sent!")
    } else {
        sendMessage(page, name, message)
    }
}

async function sendMessage(page, name, message) {
    await page.waitForTimeout(5000);
    await page.keyboard.press('Control+K');
    await page.waitForTimeout(1000);
    await page.fill('input[aria-label="Quick switcher"]', name);
    await page.waitForTimeout(2000);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);
    await page.fill('div[role="textbox"]', message);
    await page.keyboard.press("Enter");
    console.log("Message sent to", name);
}

let messageHistory;

async function runScript() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await loginAndNavigate(page);

        while (true) {
            try {
                const text = await checkJournal(page);
                console.log("Result:", text);

                const match = text.match(/to\s(\w+)\s+with\s+the\s+content\s+of\s+(.+)/i);

                if (match) {
                    const name = match[1];
                    const message = match[2];
                    console.log("Recipient:", name);
                    console.log("Message Content:", message);

                    if (message === messageHistory) {
                        console.log("Message has not changed. Waiting 10 seconds and checking again.");
                        await page.waitForTimeout(10000);
                        await page.goto("https://hole.rabbit.tech/journal/details")
                    } else {
                        await discordLogin(page, name, message);
                        messageHistory = message;
                        console.log("Message history updated. Running script again in 10 seconds...");
                        await page.waitForTimeout(10000);
                        loggedIn = true;
                        await page.goto("https://hole.rabbit.tech/journal/details")
                    }
                } else {
                    console.log("No message found in the journal. Checking again in 10 seconds...");
                    await page.waitForTimeout(10000);
                    await page.goto("https://hole.rabbit.tech/journal/details")
                }
            } catch (error) {
                console.error("An error occurred while checking the journal:", error);
                await page.goto("https://hole.rabbit.tech/journal/details")
                await page.waitForTimeout(10000);
            }
        }
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        await browser.close();
    } 
}

runScript();
