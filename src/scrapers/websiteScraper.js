const axios = require('axios');
const cheerio = require('cheerio');

class WebsiteScraper {
    async scrape(url) {
        const maxRetries = 3;
        let attempts = 0;

        while (attempts < maxRetries) {
            try {
                console.log(`📡 Fetching content from: ${url}`);
                const { data } = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    }
                });

                const $ = cheerio.load(data);

                const textContent = $('body')
                    .find('p, h1, h2, h3, h4, article, .content, .product-description')
                    .map((i, el) => $(el).text().trim())
                    .get()
                    .join('\n')
                    .replace(/\s+/g, ' ')
                    .slice(0, 4000);  // Limit to 4000 characters

                console.log('✅ Website content extracted successfully');
                return textContent;
            } catch (error) {
                attempts++;
                console.error(`❌ Scraping Error (Attempt ${attempts}):`, error.message);
                if (attempts >= maxRetries) {
                    throw new Error("Failed to fetch website content after multiple attempts.");
                }
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait before retrying
            }
        }
    }
}

module.exports = WebsiteScraper;