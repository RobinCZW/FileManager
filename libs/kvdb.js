var models = requirePR('models');
var KVDB = models.KVDB;
var Promise = require('bluebird');

function getMinTime() {
  return Math.round((new Date()).getTime() / 1000 / 60);
}

var g_lastTime = 0;

function kvdb(domain) {
  return {
    child (cdomain) {
      return kvdb(domain + '.' + cdomain);
    },
    clearOutdated () {
      return KVDB.destroy({
        where: {
          expireTime: {
            $ne: 0
          },
          $and: {
            expireTime: {
              $lt: getMinTime()
            }
          }
        }
      });
    },
    gateway (chain) {
      if (getMinTime() != g_lastTime) {
        g_lastTime = getMinTime();
        return this.clearOutdated().then(chain);
      } else {
        return chain();
      }
    },
    get (key, def) {
      if (typeof def == 'undefined') {
        def = null;
      }
      key = domain + '.' + key;
      var chain = () => KVDB
        .findOne({
          where: {
            key: key
          }
        })
        .then(kv => {
          if (kv == null) {
            return def;
          } else {
            return kv.get('value');
          }
        })
      return this.gateway(chain);
    },
    set (key, val, minsAlive, updateExpire) { // 分钟单位
      key = domain + '.' + key;
      if (typeof minsAlive == 'undefined') {
        minsAlive = 0; // forever
      } else {
        minsAlive += getMinTime();
      }
      var chain = () => KVDB
        .findOrCreate({
          where: {
            key: key
          },
          defaults: {
            value: val,
            expireTime: minsAlive
          }
        })
        .spread((kv, created) => {
          if (created == false) {
            kv.set('value', val);
          }
          if (updateExpire) {
            kv.set('expireTime', minsAlive);
          }
          return kv.save();
        });
      return this.gateway(chain);
    },
    list (prefix) {
      
    }
  }
}
kvdb.config = kvdb('config');
module.exports = kvdb;