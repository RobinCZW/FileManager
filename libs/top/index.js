var TopClient = require('./topClient').TopClient;
var Promise = require('bluebird');
var config = requirePR('config/config').topClient;
var client = new TopClient(config);

module.exports = {
  execute: function (apiname, params) {
    return new Promise((resolve, reject) => {
      client.execute(apiname, params, (err, res) => {
        if (err == null) {
          resolve(res);
        } else {
          reject(err);
        }
      })
    });
  }
}