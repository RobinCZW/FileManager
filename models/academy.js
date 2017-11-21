module.exports = function(sequelize, DataTypes) {
  var Academy = sequelize.define('Academy', {
    name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        //Academy.belongsTo(models.College);
      }
    }
  });
  return Academy;
};