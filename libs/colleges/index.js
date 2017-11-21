'use strict';
var fs        = require("fs");
var ICollege  = require("./ICollege");

var idMap = {};
var nameMap = {};
fs
  .readdirSync(__dirname)
  // .filter(file => !['index.js', 'base.js'].includes(file))
  .filter(filename => /\.js$/.test(filename))
  .filter(file => file != 'index.js' && file != 'base.js')
  .forEach(function(file) {
    var cls = require('./'+file);
    if (cls != ICollege) {
      idMap[cls.ID] = cls;
      nameMap[cls.Name] = cls;
    }
  });
module.exports = {
  findById: id => {
    return idMap[id];
  },
  findByName: name => {
    return nameMap[name];
  },
  getNames: () => {
    return Object.keys(nameMap);
  }
};