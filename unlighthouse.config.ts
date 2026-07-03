import { defineUnlighthouseConfig } from 'unlighthouse/config'

export default defineUnlighthouseConfig({
    site: 'https://dsmedley.github.io/northern-worthersee/',
    scanner: {
        // WhatsApp share buttons link to api.whatsapp.com/send?text=…; the
        // crawler queues them as relative /send?… routes. String excludes are
        // matched against the path including the query string, so use a regex.
        exclude: [/^\/send/],
    },
    puppeteerOptions: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    ci: {
        budget: {
            'performance': 70,
            'accessibility': 95,
        },
    },
})
