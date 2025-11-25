import {chromium} from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
chromium.use(StealthPlugin())

export const browser = await chromium.launch({
  headless: true,
})
