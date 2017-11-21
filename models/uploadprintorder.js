"use strict";
var config = require('../config/config');

module.exports = function(sequelize, DataTypes) {
  var UploadPrintOrder = sequelize.define("UploadPrintOrder", {
    filepath: DataTypes.STRING,
    filename: DataTypes.STRING,
    addr: DataTypes.STRING,
    phone: DataTypes.STRING,
    comment: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    arrived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    instanceMethods: {
    }
  });
  
  return UploadPrintOrder;
};