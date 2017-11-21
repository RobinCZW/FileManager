module.exports = function(sequelize, DataTypes) {
  var Attachment = sequelize.define('Attachment', { // 附件
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

  });
  return Attachment
}