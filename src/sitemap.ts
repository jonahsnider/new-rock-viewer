import {browser} from './browser.ts'
import {cache} from './cache.ts'
import {env} from './env.ts'

const SITEMAP_URL = 'https://www.newrock.com/en/sitemap'

export async function getSitemap(): Promise<string> {
  return cache.getOrSet({
    key: SITEMAP_URL,
    ttl: '1w',
    factory: async () => {
      const page = await browser.newPage({
        extraHTTPHeaders: {
          Cookie: env.NEW_ROCK_COOKIE,
        },
      })

      await page.goto(SITEMAP_URL, {waitUntil: 'commit'})
      const content = await page.content()

      return content
    },
  })
}
