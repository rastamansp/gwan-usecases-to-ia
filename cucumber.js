module.exports = {
  default: {
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    require: ['test/bdd/**/*.ts'],
    format: ['@cucumber/pretty-formatter'],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    parallel: 2,
    retry: 1
  },
  'bdd:search-product': {
    require: ['test/bdd/search-product/**/*.ts'],
    format: ['@cucumber/pretty-formatter'],
    formatOptions: {
      snippetInterface: 'async-await'
    }
  },
  'bdd:worker': {
    require: ['test/bdd/worker/**/*.ts'],
    format: ['@cucumber/pretty-formatter'],
    formatOptions: {
      snippetInterface: 'async-await'
    }
  }
};
