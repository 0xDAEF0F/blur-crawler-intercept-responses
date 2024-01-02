// For more information, see https://crawlee.dev/
import { PlaywrightCrawler } from 'crawlee';

const collection = "pudgypenguins"
const startUrl = [`https://blur.io/collection/${collection}`];

const tokensMap = new Map<string, { name: string, price: number, id: number }>()

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const crawler = new PlaywrightCrawler({
    // Use the requestHandler to process each of the crawled pages.
    async requestHandler({ page, log, }) {
        await page.setViewportSize({ width: 1440, height: 986 })

        page.on('response', async (response) => {
            const urlPattern = new RegExp('^https://core-api\.prod\.blur\.io/v1/collections/[^/]+/tokens\?.*$');
            if (urlPattern.test(response.url())) {
                const body = JSON.parse(await response.text())
                body?.tokens?.forEach((token: any) => {
                    if (tokensMap.has(token.tokenId)) return

                    tokensMap.set(token.tokenId, {
                        name: token.name,
                        id: Number(token.tokenId),
                        price: Number(token.price.amount)
                    })
                })
            }
        })

        const table = page.locator('div.interactive.rows').first()

        await table.hover()

        log.info('hovered on table')

        let lastPosition = 0;
        let currentPosition = 0;
        do {
            lastPosition = currentPosition;

            // Scroll down
            currentPosition = await table.evaluate(element => {
                element.scrollBy(0, window.innerHeight);
                return element.scrollTop;
            });

            // Wait for a certain amount of time (e.g., 1000 milliseconds)
            await page.waitForTimeout(1000);

        } while (currentPosition !== lastPosition);

        tokensMap.forEach((token) => {
            console.log(token)
        })
    },
    // Comment this option to scrape the full website.
    maxRequestsPerCrawl: 20,
    headless: false,
});

// Add first URL to the queue and start the crawl.
await crawler.run(startUrl);
