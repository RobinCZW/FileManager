module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Ad', {
    enabled: DataTypes.BOOLEAN,
    remark: DataTypes.STRING,
    pic: DataTypes.STRING,
    url: DataTypes.STRING,
    fallback: DataTypes.STRING,
    views: DataTypes.INTEGER
  });
};
