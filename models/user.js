"use strict";
var crypto = require('crypto');
var config = require('../config/config');
var phoneRE = new RegExp(config.phoneRE);
//phone, password, nick, gender, schoolId, academyId, schoolUn, schoolPw, enterYear
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    username: {
      type: DataTypes.STRING, // 手机号
      unique: true,
      validate: {
        //is: phoneRE
      }
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        is: /^.{6,}$/
      }
    },
    nickname: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        is: /^.{1,}$/
      }
    },
    gender: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['男', '女']]
      }
    },
    enterYear: {
      type: DataTypes.STRING,
      validate: {
        is: /^(19|20)\d{2}$/ //这个世纪都不用改了
      }
    },
    schoolInfo: DataTypes.TEXT, // for lib
    avatar: {
      type: DataTypes.STRING,
      defaultValue: ''
    }, // such as upload/111222
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    phone: {
      type: DataTypes.STRING, // 手机号
      validate: {
        is: phoneRE
      }
    }
  }, {
    classMethods: {
      associate: function(models) {
        //User.hasMany(models.Task)
        User.belongsTo(models.College);
        User.belongsTo(models.Academy);
      },
      pwHash: function (pw) {
        var sha1 = crypto.createHash('sha1');
        sha1.update(pw);
        return sha1.digest('hex');
      },
      initTable: function () {
        User.findOrCreate({
          where: {
            username: 'admin'
          },
          defaults: {
            password: User.pwHash('admin'),
            isAdmin: true,
            nickname: '管理员'
          }
        });
      }
    },
    instanceMethods: {
      modify: function (newVal) {
        // TODO: Academy必须属于College
        const allowedField = ['nickname', 'gender', 'AcademyId', 'CollegeId', 'password', 'enterYear'];
        for (let field of allowedField) {
          if (Object.keys(newVal).includes(field)) {
            let val = newVal[field]
            if (field === 'password') {
              val = User.pwHash(val);
            }
            if (field === 'CollegeId') {
              if (this.get('CollegeId') !== null) {
                // 存在则不修改
                continue
              }
            }
            this.set(field, val);
          }
        }
        return this.save();
      },
      checkPassword: function (password) {
        return User.pwHash(password) === this.password;
      },
      json: function () {
        const visibleFields = ['id', 'username', 'isAdmin', 'nickname', 'gender', 'CollegeId', 'AcademyId', 'avatar', 'enterYear', 'phone'];
        var obj = {};
        for (let field of visibleFields) {
          obj[field] = this.get(field);
        }
        return obj;
      }
    }
  });
  
  return User;
};