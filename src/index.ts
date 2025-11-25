import {load} from 'cheerio'
import {browser} from './browser.ts'
import {getSitemap} from './sitemap.ts'
import {cache} from './cache.ts'

const content = await getSitemap()

await browser.close()
await cache.disconnectAll()

// First, scrape sitemap page to get entry categories for product listings
const $ = load(content)

console.log('Page Title:', $('title').text())
