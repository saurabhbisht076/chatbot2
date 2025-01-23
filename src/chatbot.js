const axios = require('axios');
const readline = require('readline');
const WebsiteScraper = require('./scrapers/websiteScraper');
require('dotenv').config();

class WebsiteChatbot {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.websiteScraper = new WebsiteScraper();
        this.huggingfaceApiKey = process.env.HF_API_KEY;
        this.cache = new Map();  // For caching responses to avoid redundant API calls
    }

    async generateResponse(websiteContext, userQuery) {
        const cacheKey = `${websiteContext}-${userQuery}`;
        
        // Check if the response is cached
        if (this.cache.has(cacheKey)) {
            console.log("💬 Using cached response...");
            return this.cache.get(cacheKey);
        }

        try {
            console.log('🧠 Generating intelligent response...');
            const response = await axios.post(
                'https://api-inference.huggingface.co/models/gpt2',
                {
                    inputs: `Context: ${websiteContext}\n\nQuestion: ${userQuery}\n\nDetailed Answer:`
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.huggingfaceApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000  // 30 seconds timeout
                }
            );

            // Extract and clean up the generated response
            let generatedResponse = response.data[0].generated_text || 
                "I couldn't generate a specific response based on the context.";

            generatedResponse = generatedResponse
                .split('Detailed Answer:')[1]  // Take content after the prompt
                .trim()
                .split('\n')[0];  // Take the first paragraph

            generatedResponse = generatedResponse.replace(/\s{2,}/g, ' ').trim();

            // Cache the response for future use
            this.cache.set(cacheKey, generatedResponse);

            // Optionally set a timeout to expire the cache after a specific period (e.g., 1 minute)
            setTimeout(() => this.cache.delete(cacheKey), 60000);

            return generatedResponse || "I'm unable to provide a detailed response at this moment.";
        } catch (error) {
            console.error('❌ Response Generation Error:', error.message);

            // Fallback response based on context
            if (websiteContext.includes('coffee table')) {
                return "Based on the website context, this appears to be a page about coffee tables. While I couldn't generate a full response, the content seems related to furniture or home decor.";
            }

            return "I apologize, but I'm unable to generate a response due to technical limitations.";
        }
    }

    async start() {
        console.log('🤖 Website Contextual Chatbot');
        
        try {
            const url = await this.prompt('Enter the website URL to explore: ');
            const websiteContext = await this.websiteScraper.scrape(url);
            this.conversationLoop(websiteContext);
        } catch (error) {
            console.error('❌ Initialization Error:', error.message);
            this.rl.close();
        }
    }

    conversationLoop(websiteContext) {
        this.rl.question('❓ Ask a question (or type "quit"): ', async (query) => {
            const sanitizedQuery = query.trim().replace(/[^a-zA-Z0-9\s?]/g, '');  // Remove special chars

            if (sanitizedQuery.toLowerCase() === 'quit') {
                console.log('👋 Chatbot session ended.');
                this.rl.close();
                return;
            }

            try {
                const response = await this.generateResponse(websiteContext, sanitizedQuery);
                console.log('💬 Chatbot:', response);
                this.conversationLoop(websiteContext);
            } catch (error) {
                console.error('❌ Conversation Error:', error.message);
                this.rl.close();
            }
        });
    }

    prompt(question) {
        return new Promise((resolve) => {
            this.rl.question(question, resolve);
        });
    }
}

module.exports = WebsiteChatbot;