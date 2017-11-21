module.exports = function(sequelize, DataTypes) {
  var UserGroup = sequelize.define('UserGroup', {
    name: {
      type: DataTypes.STRING,
      unique: true
    },
    
  });
  return UserGroup;
};