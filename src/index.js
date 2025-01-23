const WebsiteChatbot = require('./chatbot');
require('dotenv').config();

async function main() {
    try {
        const chatbot = new WebsiteChatbot();
        await chatbot.start();
    } catch (error) {
        console.error('Application Startup Error:', error);
        process.exit(1);
    }
}

main();