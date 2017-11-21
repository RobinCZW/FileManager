module.exports = function(sequelize, DataTypes) {
  var Folder = sequelize.define('Folder', {
    name: DataTypes.STRING,

  }, {
    classMethods: {
      associate: function(models) {
        Folder.hasOne(models.UserGroup);
        Folder.belongsTo(models.User);
      }
    }
  });
  return Folder;
}