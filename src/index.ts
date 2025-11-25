import { browser } from './browser.ts';
import { topLevelCache } from './cache.ts';
import { getCategories, getSitemap } from './sitemap.ts';

const sitemapHtml = await getSitemap();
const categories = getCategories(sitemapHtml);

console.log('Categories:', categories);

await Promise.all([topLevelCache.disconnectAll(), browser.close()]);
