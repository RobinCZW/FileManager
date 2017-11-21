module.exports = function(sequelize, DataTypes) {
  var FileFolder = sequelize.define('FileFolder');
  var File = sequelize.define('File', {
    // TODO 文件名加上
    spath: DataTypes.STRING, // 文件逻辑路径, 如 /高数/试卷.doc
    size: DataTypes.INTEGER,
    md5: DataTypes.STRING,
    ip: DataTypes.STRING,
    uploadTime: DataTypes.BIGINT,
    state: DataTypes.ENUM('NORMAL', 'DELETED')
  }, {
    classMethods: {
      associate: function(models) {
        File.belongsTo(models.User, {as: 'uploadUser'});
        File.belongsTo(models.College);
      }
    }
  });
  return File;
};
