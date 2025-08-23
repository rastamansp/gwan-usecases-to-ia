module.exports = {
  default: {
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    require: ['test/bdd/**/*.ts'],
    format: ['@cucumber/pretty-formatter'],
    formatOptions: { snippetInterface: 'async-await' },
    paths: ['test/bdd/**/*.feature'],
    parallel: 1,
    timeout: 30000
  }
};
