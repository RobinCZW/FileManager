var path = require('path')
var webpack = require('webpack')
var webpackConfig = require('../config/webpack.prod.js')

webpack(webpackConfig, function (err, stats) {
  if (err) throw err;
  process.stdout.write(stats.toString({
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }) + '\n')
})
