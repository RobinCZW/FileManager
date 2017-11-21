"use strict";
var crypto = require('crypto');
var config = require('../config/config');
//phone, password, nick, gender, schoolId, academyId, schoolUn, schoolPw, enterYear
module.exports = function(sequelize, DataTypes) {
  var UserAuth = sequelize.define("UserAuth", {
    platform: {
      type: DataTypes.STRING, // 认证平台, 如qq, wx
    },
    platformId: {
      type: DataTypes.STRING, // openid
    }
  }, {
    classMethods: {
      associate: function(models) {
        // models.User.hasOne(UserAuth);
        UserAuth.belongsTo(models.User)
      }
    },
    instanceMethods: {
    }
  });
  
  return UserAuth;
};