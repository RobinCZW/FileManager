module.exports = function(sequelize, DataTypes) {
  var Community = sequelize.define('Community', { // 话题
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

  });
  return Community
}