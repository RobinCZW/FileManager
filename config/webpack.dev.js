var config = require('./webpack.base')
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin');

Object.keys(config.entry).forEach(function (name) {
  config.entry[name] = ['./bin/dev-client'].concat(config.entry[name])
})

config.devtool = 'inline-source-map';

config.plugins.push(new webpack.HotModuleReplacementPlugin())
config.plugins.push(new HtmlWebpackPlugin({
  filename: 'admin.html',
  template: 'admin.html',
  inject: true,
  chunks: ['app']
  // minify: {
  //   removeComments: true,
  //   collapseWhitespace: true,
  //   removeAttributeQuotes: true
  // },
  // chunksSortMode: 'dependency'
}));
config.plugins.push(new HtmlWebpackPlugin({
  filename: 'index.html',
  template: 'index.html',
  inject: true,
  chunks: ['indexPage']
}));
module.exports = config;