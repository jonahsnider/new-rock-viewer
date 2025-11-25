import {BentoCache, bentostore} from 'bentocache'
import {fileDriver} from 'bentocache/drivers/file'

export const cache = new BentoCache({
  default: 'file',
  stores: {
    file: bentostore().useL2Layer(
      fileDriver({
        directory: './cache',
        pruneInterval: '1h',
      }),
    ),
  },
})
