import {BentoCache, bentostore} from 'bentocache'
import {fileDriver} from 'bentocache/drivers/file'
import type {CacheProvider} from 'bentocache/types'
import path from 'node:path'

export const topLevelCache = new BentoCache({
  default: 'file',
  stores: {
    file: bentostore().useL2Layer(
      fileDriver({
        directory: path.join(import.meta.dirname, '..', 'cache'),
        pruneInterval: '1h',
      }),
    ),
  },
})

const browserCacheRaw = topLevelCache.namespace('browser')

export const browserCache = {
  commit: browserCacheRaw.namespace('commit'),
  domcontentloaded: browserCacheRaw.namespace('domcontentloaded'),
  load: browserCacheRaw.namespace('load'),
  networkidle: browserCacheRaw.namespace('networkidle'),
} satisfies Record<'load' | 'domcontentloaded' | 'networkidle' | 'commit', CacheProvider>
