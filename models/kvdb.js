
module.exports = function(sequelize, DataTypes) {
  KVDB = sequelize.define('KVDB', {
    key: DataTypes.STRING,
    value: DataTypes.TEXT,
    expireTime: DataTypes.INTEGER, // 到期时间
  }, {
    timestamps: false,
    indexes2: [{
      fields: ['key']
    }]
  });
  return KVDB;
};
