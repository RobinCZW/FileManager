var config = require('./webpack.base');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

config.plugins.push(new webpack.optimize.UglifyJsPlugin({
  compress: {
    warnings: false
  }
}));
config.plugins.push(new webpack.optimize.OccurenceOrderPlugin());
config.plugins.push(new HtmlWebpackPlugin({
  filename: 'admin.html',
  template: 'admin.html',
  inject: true,
  chunks: ['vendor', 'app'],
  minify: {
    removeComments: true,
    collapseWhitespace: true,
    removeAttributeQuotes: true
  },
  chunksSortMode: 'dependency'
}));
config.plugins.push(new HtmlWebpackPlugin({
  filename: 'index.html',
  template: 'index.html',
  inject: true,
  chunks: ['vendor', 'indexPage'],
  minify: {
    removeComments: true,
    collapseWhitespace: true,
    removeAttributeQuotes: true
  },
  chunksSortMode: 'dependency'
}));
config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
  name: 'vendor',
  minChunks: function (module, count) {
    // any required modules inside node_modules are extracted to vendor
    if (!module.resource) return false;
    if (!/\.js$/.test(module.resource)) return false;
    var inModules = module.resource.indexOf(path.join(__dirname, '../node_modules')) === 0;
    return inModules
  }
}));
// config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
//   name: 'manifest',
//   chunks: ['vendor']
// }));
config.plugins.push();

module.exports = config;